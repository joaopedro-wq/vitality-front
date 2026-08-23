import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { BdTourService, type BdTourStep } from 'bandeira-ui';

import { AuthService } from '../auth/auth.service';
import { apiPaths } from '../http/api-paths';
import type { ApiResponse } from '../models/api-response.model';
import type { OnboardingStatus, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly tour = inject(BdTourService);
  private automaticUserId: number | null = null;
  private readonly awaitingOutcome = signal(false);

  readonly saving = signal(false);
  private readonly manualRun = signal(false);

  constructor() {
    effect(() => {
      const outcome = this.tour.outcome();
      if (!this.awaitingOutcome() || this.tour.active() || !outcome) return;

      this.awaitingOutcome.set(false);
      if (this.manualRun()) return;
      this.persist(outcome.completed ? 'completed' : 'skipped');
    });
  }

  evaluateUser(user: User | null): void {
    if (!user) {
      this.automaticUserId = null;
      return;
    }
    if (this.automaticUserId === user.id) return;

    this.automaticUserId = user.id;
    if (user.onboarding_status === 'pending') {
      this.start(false);
    }
  }

  restart(): void {
    this.start(true);
  }

  private start(manual: boolean): void {
    if (this.tour.active() || this.awaitingOutcome()) return;

    this.manualRun.set(manual);
    this.awaitingOutcome.set(true);
    window.setTimeout(() => {
      this.tour.start(this.steps(), {
        next: this.transloco.translate('onboarding.next'),
        prev: this.transloco.translate('onboarding.back'),
        finish: this.transloco.translate('onboarding.finish'),
        skip: this.transloco.translate('onboarding.skip'),
        counter: (current, total) =>
          this.transloco.translate('onboarding.step', { current, total }),
      });
    });
  }

  private steps(): BdTourStep[] {
    const suffix = window.matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop';
    const target = (item: 'diary' | 'goals' | 'plans') =>
      `[data-tour="onboarding-${item}-${suffix}"]`;

    return [
      {
        target: target('diary'),
        title: this.transloco.translate('onboarding.diary.title'),
        content: this.transloco.translate('onboarding.diary.description'),
        placement: 'auto',
      },
      {
        target: target('goals'),
        title: this.transloco.translate('onboarding.goals.title'),
        content: this.transloco.translate('onboarding.goals.description'),
        placement: 'auto',
      },
      {
        target: target('plans'),
        title: this.transloco.translate('onboarding.plans.title'),
        content: this.transloco.translate('onboarding.plans.description'),
        placement: 'auto',
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
        next: (response) => {
          this.auth.setCurrentUser(response.data);
        },
        error: () => this.toastr.error(this.transloco.translate('onboarding.saveError')),
      });
  }
}
