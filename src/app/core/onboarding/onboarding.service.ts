import { HttpClient } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
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
  targets: readonly string[];
  title: string;
  content: string;
}

const TARGET_WAIT_TIMEOUT_MS = 2_400;
const TARGET_RETRY_INTERVAL_MS = 80;

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly tour = inject(BdTourService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private automaticUserId: number | null = null;
  private readonly awaitingOutcome = signal(false);
  private readonly preparingStage = signal(false);
  private readonly stage = signal(0);
  private readonly manualRun = signal(false);
  private runId = 0;

  readonly saving = signal(false);

  constructor() {
    effect(() => {
      const outcome = this.tour.outcome();
      if (!this.awaitingOutcome() || this.tour.active() || !outcome) return;

      this.awaitingOutcome.set(false);
      this.clearSpotShape();
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
    if (this.tour.active() || this.awaitingOutcome() || this.preparingStage()) return;

    this.manualRun.set(manual);
    this.stage.set(0);
    this.startCurrentStage();
  }

  private startCurrentStage(): void {
    const stage = this.stages()[this.stage()];
    if (!stage) return;

    const currentRunId = ++this.runId;
    this.preparingStage.set(true);
    this.router.navigateByUrl(stage.route).then(async (navigated) => {
      if (!navigated || currentRunId !== this.runId) {
        this.preparingStage.set(false);
        return;
      }

      const target = await this.waitForVisibleTarget(stage.targets, currentRunId);
      if (currentRunId !== this.runId) return;

      this.preparingStage.set(false);
      if (!target) return;

      this.applySpotShape(target);
      this.openStage(stage, target);
    });
  }

  private openStage(stage: OnboardingStage, target: string): void {
    this.awaitingOutcome.set(true);
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
        targets: ['[data-tour="onboarding-register-meal"]'],
        title: this.transloco.translate('onboarding.dashboard.title'),
        content: this.transloco.translate('onboarding.dashboard.description'),
      },
      {
        route: '/diario',
        targets: [
          '[data-tour="onboarding-diary-action"]',
          '[data-tour="onboarding-diary-map"]',
          '[data-tour="onboarding-diary-desktop"]',
          '[data-tour="onboarding-diary-mobile"]',
        ],
        title: this.transloco.translate('onboarding.diaryAction.title'),
        content: this.transloco.translate('onboarding.diaryAction.description'),
      },
      {
        route: '/metas',
        targets: [
          '[data-tour="onboarding-goals-action"]',
          '[data-tour="onboarding-goals-desktop"]',
          '[data-tour="onboarding-goals-mobile"]',
        ],
        title: this.transloco.translate('onboarding.goalsAction.title'),
        content: this.transloco.translate('onboarding.goalsAction.description'),
      },
      {
        route: '/dietas',
        targets: [
          '[data-tour="onboarding-plans-action"]',
          '[data-tour="onboarding-plans-desktop"]',
          '[data-tour="onboarding-plans-mobile"]',
        ],
        title: this.transloco.translate('onboarding.plansAction.title'),
        content: this.transloco.translate('onboarding.plansAction.description'),
      },
    ];
  }

  private async waitForVisibleTarget(
    selectors: readonly string[],
    currentRunId: number,
  ): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) return null;

    const deadline = Date.now() + TARGET_WAIT_TIMEOUT_MS;
    do {
      const target = this.findVisibleTarget(selectors);
      if (target) return target;

      await new Promise<void>((resolve) => window.setTimeout(resolve, TARGET_RETRY_INTERVAL_MS));
    } while (Date.now() < deadline && currentRunId === this.runId);

    return null;
  }

  private findVisibleTarget(selectors: readonly string[]): string | null {
    for (const selector of selectors) {
      const target = Array.from(this.document.querySelectorAll<HTMLElement>(selector)).find(
        (element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden';
        },
      );
      if (target) return selector;
    }
    return null;
  }

  private applySpotShape(selector: string): void {
    const target = this.document.querySelector<HTMLElement>(selector);
    if (!target) return;

    const styles = window.getComputedStyle(target);
    // O spot tem 10px de respiro; somar esse valor preserva a curvatura visual
    // do alvo em vez de deixar o recorte maior com cantos aparentemente retos.
    const radius = [
      styles.borderTopLeftRadius,
      styles.borderTopRightRadius,
      styles.borderBottomRightRadius,
      styles.borderBottomLeftRadius,
    ]
      .map((value) => `calc(${value} + 10px)`)
      .join(' ');

    this.document.documentElement.style.setProperty('--vitality-tour-spot-radius', radius);
  }

  private clearSpotShape(): void {
    this.document.documentElement.style.removeProperty('--vitality-tour-spot-radius');
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
