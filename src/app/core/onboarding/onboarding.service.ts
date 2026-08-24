import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BdTourService } from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { apiPaths } from '../http/api-paths';
import type { ApiResponse } from '../models/api-response.model';
import type { OnboardingStatus, User } from '../models/user.model';

interface OnboardingStage {
  route: string;
  target: () => string;
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly tour = inject(BdTourService);
  private readonly router = inject(Router);
  private automaticUserId: number | null = null;
  private readonly awaitingOutcome = signal(false);
  private readonly stage = signal(0);
  private readonly manualRun = signal(false);

  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const outcome = this.tour.outcome();
      if (!this.awaitingOutcome() || this.tour.active() || !outcome) return;

      this.awaitingOutcome.set(false);
      if (!outcome.completed) {
        if (!this.manualRun()) this.persist('skipped');
        return;
      }

      if (this.stage() < this.stages().length - 1) {
        this.stage.update((current) => current + 1);
        this.startCurrentStage();
        return;
      }

      if (!this.manualRun()) this.persist('completed');
    });
  }

  evaluateUser(user: User | null): void {
    if (!user) {
      this.automaticUserId = null;
      return;
    }
    if (this.automaticUserId === user.id) return;

    this.automaticUserId = user.id;
    if (user.onboarding_status === 'pending') this.start(false);
  }

  restart(): void {
    this.start(true);
  }

  private start(manual: boolean): void {
    if (this.tour.active() || this.awaitingOutcome()) return;

    this.manualRun.set(manual);
    this.stage.set(0);
    this.startCurrentStage();
  }

  private startCurrentStage(): void {
    const stage = this.stages()[this.stage()];
    if (!stage) return;

    this.router.navigateByUrl(stage.route).then(() => {
      // A rota já foi ativada neste ponto. Um frame dá tempo apenas para o Angular
      // desenhar o contêiner estável da página, sem criar uma espera perceptível.
      window.requestAnimationFrame(() => this.openStage(stage));
    });
  }

  private openStage(stage: OnboardingStage): void {
    this.awaitingOutcome.set(true);
    const target = stage.target();
    this.tour.start([{ target, title: stage.title, content: stage.content, placement: 'auto' }], {
      next: this.transloco.translate('onboarding.next'),
      prev: this.transloco.translate('onboarding.back'),
      finish:
        this.stage() === this.stages().length - 1
          ? this.transloco.translate('onboarding.finish')
          : this.transloco.translate('onboarding.next'),
      skip: this.transloco.translate('onboarding.skip'),
      counter: () =>
        this.transloco.translate('onboarding.step', {
          current: this.stage() + 1,
          total: this.stages().length,
        }),
    });
  }

  private stages(): OnboardingStage[] {
    return [
      {
        route: '/dashboard',
        target: () => '[data-tour="onboarding-dashboard"]',
        title: this.transloco.translate('onboarding.dashboard.title'),
        content: this.transloco.translate('onboarding.dashboard.description'),
      },
      {
        route: '/diario',
        target: () => '[data-tour="onboarding-diary-page"]',
        title: this.transloco.translate('onboarding.diary.title'),
        content: this.transloco.translate('onboarding.diary.description'),
      },
      {
        route: '/metas',
        target: () => '[data-tour="onboarding-goals-page"]',
        title: this.transloco.translate('onboarding.goals.title'),
        content: this.transloco.translate('onboarding.goals.description'),
      },
      {
        route: '/dietas',
        target: () => '[data-tour="onboarding-plans-page"]',
        title: this.transloco.translate('onboarding.plans.title'),
        content: this.transloco.translate('onboarding.plans.description'),
      },
    ];
  }

  private persist(status: Exclude<OnboardingStatus, 'pending'>): void {
    if (this.saving()) return;

    this.saving.set(true);
    this.http
      .put<ApiResponse<User>>(apiPaths.userOnboarding(), { status })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => this.auth.setCurrentUser(response.data),
        error: () => this.toastr.error(this.transloco.translate('onboarding.saveError')),
      });
  }
}
