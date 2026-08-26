import { HttpClient } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BdTourService } from 'bandeira-ui';
import { ToastrService } from 'ngx-toastr';
import { filter, finalize, firstValueFrom } from 'rxjs';

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

interface PageHint {
  id: PageHintId;
  route: string;
  steps: readonly OnboardingStage[];
}

interface ActiveTourStep {
  target: string;
  title: string;
  content: string;
  placement: 'auto';
}

type PageHintId = 'diary' | 'goals' | 'plans';

const TARGET_WAIT_TIMEOUT_MS = 2_400;
const TARGET_RETRY_INTERVAL_MS = 80;
const PAGE_HINTS_STORAGE_PREFIX = 'vitality:onboarding:page-hints:v1:';

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
  private currentUserId: number | null = null;
  /**
   * Mantém o estado atual separado do id. O mesmo usuário muda de `pending`
   * para `completed`/`skipped` durante a sessão, portanto o id não é suficiente
   * para decidir se uma dica por rota pode abrir.
   */
  private currentOnboardingStatus: OnboardingStatus | null = null;
  private readonly awaitingOutcome = signal(false);
  private readonly preparingStage = signal(false);
  private readonly manualRun = signal(false);
  private readonly activePageHint = signal<PageHintId | null>(null);
  private readonly introStage = signal(0);
  private readonly sessionPageHints = new Set<string>();
  private welcomeManualRun = false;
  private runId = 0;

  readonly saving = signal(false);
  readonly welcomeOpen = signal(false);

  constructor() {
    effect(() => {
      const outcome = this.tour.outcome();
      if (!this.awaitingOutcome() || this.tour.active() || !outcome) return;

      this.awaitingOutcome.set(false);
      this.clearSpotShape();
      const pageHint = this.activePageHint();
      if (pageHint) {
        this.activePageHint.set(null);
        this.markPageHintSeen(pageHint);
        return;
      }

      if (!outcome.completed) {
        if (!this.manualRun()) this.persist('skipped');
        return;
      }

      if (this.introStage() < this.stages().length - 1) {
        this.introStage.update((current) => current + 1);
        this.startCurrentStage();
        return;
      }

      if (!this.manualRun()) this.persist('completed');
    });

    effect(() => {
      const step = this.tour.step();
      if (step?.target) this.applySpotShape(step.target);
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.handleNavigation(event.urlAfterRedirects));
  }

  evaluateUser(user: User | null): void {
    if (!user) {
      this.automaticUserId = null;
      this.currentUserId = null;
      this.currentOnboardingStatus = null;
      this.welcomeOpen.set(false);
      this.cancelPendingPageHint();
      return;
    }

    this.currentUserId = user.id;
    this.currentOnboardingStatus = user.onboarding_status;
    if (this.automaticUserId === user.id) return;

    this.automaticUserId = user.id;
    if (user.onboarding_status === 'pending') this.openWelcome(false);
    else this.handleNavigation(this.router.url);
  }

  restart(): void {
    this.openWelcome(true);
  }

  beginIntroduction(): void {
    if (!this.welcomeOpen()) return;

    this.welcomeOpen.set(false);
    this.start(this.welcomeManualRun);
  }

  dismissWelcome(): void {
    if (!this.welcomeOpen()) return;

    this.welcomeOpen.set(false);
    if (!this.welcomeManualRun) this.persist('skipped');
  }

  private start(manual: boolean): void {
    if (this.tour.active() || this.awaitingOutcome() || this.preparingStage()) return;

    this.manualRun.set(manual);
    this.introStage.set(0);
    this.startCurrentStage();
  }

  private openWelcome(manual: boolean): void {
    if (this.welcomeOpen() || this.tour.active() || this.awaitingOutcome() || this.preparingStage())
      return;

    this.welcomeManualRun = manual;
    this.welcomeOpen.set(true);
  }

  private async startCurrentStage(): Promise<void> {
    const currentRunId = ++this.runId;
    this.preparingStage.set(true);

    if (!(await this.loadActiveTranslations()) || currentRunId !== this.runId) {
      if (currentRunId === this.runId) this.preparingStage.set(false);
      return;
    }

    const stage = this.stages()[this.introStage()];
    if (!stage) {
      this.preparingStage.set(false);
      return;
    }

    // `navigateByUrl` resolve com `false` quando o destino é a própria URL atual
    // (`onSameUrlNavigation: 'ignore'`, o default do Router) — não é uma falha de
    // navegação, é só não ter nada a fazer. O primeiro passo do tour aponta pro
    // `/dashboard`, a tela onde o usuário normalmente já está logo após o login,
    // então tratar `false` como erro abortava a introdução bem no primeiro clique
    // em "Conhecer o sistema". Só um `false` combinado com estar em outra rota é
    // falha de navegação de verdade.
    const alreadyThere = this.router.url.split('?')[0] === stage.route;
    this.router.navigateByUrl(stage.route).then(async (navigated) => {
      if ((!navigated && !alreadyThere) || currentRunId !== this.runId) {
        this.preparingStage.set(false);
        return;
      }

      const target = await this.waitForVisibleTarget(stage.targets, currentRunId);
      if (currentRunId !== this.runId) return;

      this.preparingStage.set(false);
      // Sem alvo visível a tempo (layout ainda assentando, breakpoint intermediário),
      // o tour não pode simplesmente morrer aqui: o `BdTourComponent` já degrada sozinho
      // para um balão centralizado quando o seletor não resolve nenhum elemento (ver
      // `resolveTarget`/`measure` na lib), então sempre seguimos em frente com o primeiro
      // seletor como melhor esforço em vez de abortar a introdução em silêncio.
      this.openTour([{ ...stage, target: target ?? stage.targets[0], placement: 'auto' }], 'intro');
    });
  }

  private openTour(steps: readonly ActiveTourStep[], context: 'intro' | 'page-hint'): void {
    this.awaitingOutcome.set(true);
    this.tour.start([...steps], {
      next: this.transloco.translate('onboarding.next'),
      prev: this.transloco.translate('onboarding.back'),
      finish: this.transloco.translate(
        context === 'page-hint'
          ? 'onboarding.pageHintFinish'
          : this.introStage() === this.stages().length - 1
            ? 'onboarding.finish'
            : 'onboarding.next',
      ),
      skip: this.transloco.translate('onboarding.skip'),
      counter: () =>
        context === 'intro'
          ? this.transloco.translate('onboarding.step', {
              current: this.introStage() + 1,
              total: this.stages().length,
            })
          : this.transloco.translate('onboarding.quickTip'),
    });
  }

  private stages(): OnboardingStage[] {
    return [
      {
        route: '/dashboard',
        targets: [
          '[data-tour="onboarding-dashboard-desktop"]',
          '[data-tour="onboarding-dashboard-mobile"]',
        ],
        title: this.transloco.translate('onboarding.dashboard.title'),
        content: this.transloco.translate('onboarding.dashboard.description'),
      },
      {
        route: '/diario',
        targets: [
          '[data-tour="onboarding-diary-desktop"]',
          '[data-tour="onboarding-diary-mobile"]',
        ],
        title: this.transloco.translate('onboarding.diary.title'),
        content: this.transloco.translate('onboarding.diary.description'),
      },
      {
        route: '/metas',
        targets: [
          '[data-tour="onboarding-goals-desktop"]',
          '[data-tour="onboarding-goals-mobile"]',
        ],
        title: this.transloco.translate('onboarding.goals.title'),
        content: this.transloco.translate('onboarding.goals.description'),
      },
      {
        route: '/dietas',
        targets: [
          '[data-tour="onboarding-plans-desktop"]',
          '[data-tour="onboarding-plans-mobile"]',
        ],
        title: this.transloco.translate('onboarding.plans.title'),
        content: this.transloco.translate('onboarding.plans.description'),
      },
    ];
  }

  private pageHints(): PageHint[] {
    return [
      {
        id: 'diary',
        route: '/diario',
        steps: [
          {
            route: '/diario',
            targets: ['[data-tour="onboarding-diary-map"]'],
            title: this.transloco.translate('onboarding.diaryMap.title'),
            content: this.transloco.translate('onboarding.diaryMap.description'),
          },
          {
            route: '/diario',
            targets: ['[data-tour="onboarding-diary-macros"]'],
            title: this.transloco.translate('onboarding.diaryMacros.title'),
            content: this.transloco.translate('onboarding.diaryMacros.description'),
          },
          {
            route: '/diario',
            targets: ['[data-tour="onboarding-diary-action"]'],
            title: this.transloco.translate('onboarding.diaryAction.title'),
            content: this.transloco.translate('onboarding.diaryAction.description'),
          },
        ],
      },
      {
        id: 'goals',
        route: '/metas',
        steps: [
          {
            route: '/metas',
            targets: ['[data-tour="onboarding-goals-action"]'],
            title: this.transloco.translate('onboarding.goalsAction.title'),
            content: this.transloco.translate('onboarding.goalsAction.description'),
          },
          {
            route: '/metas',
            targets: [
              '[data-tour="onboarding-goals-form"]',
              '[data-tour="onboarding-goals-review"]',
            ],
            title: this.transloco.translate('onboarding.goalsNext.title'),
            content: this.transloco.translate('onboarding.goalsNext.description'),
          },
        ],
      },
      {
        id: 'plans',
        route: '/dietas',
        steps: [
          {
            route: '/dietas',
            targets: ['[data-tour="onboarding-plans-action"]'],
            title: this.transloco.translate('onboarding.plansAction.title'),
            content: this.transloco.translate('onboarding.plansAction.description'),
          },
          {
            route: '/dietas',
            targets: [
              '[data-tour="onboarding-plans-empty"]',
              '[data-tour="onboarding-plans-list"]',
            ],
            title: this.transloco.translate('onboarding.plansOverview.title'),
            content: this.transloco.translate('onboarding.plansOverview.description'),
          },
        ],
      },
    ];
  }

  private handleNavigation(url: string): void {
    const route = url.split('?')[0];
    const currentHint = this.activePageHint();
    if (currentHint && this.pageHints().find((hint) => hint.id === currentHint)?.route !== route) {
      this.cancelPendingPageHint();
    }

    const hint = this.pageHints().find((item) => item.route === route);
    if (hint) this.startPageHint(hint);
  }

  private async startPageHint(hint: PageHint): Promise<void> {
    if (!this.canShowPageHint(hint.id)) return;

    const currentRunId = ++this.runId;
    this.preparingStage.set(true);
    this.activePageHint.set(hint.id);
    this.manualRun.set(false);

    if (!(await this.loadActiveTranslations()) || currentRunId !== this.runId) {
      if (currentRunId === this.runId) {
        this.preparingStage.set(false);
        this.activePageHint.set(null);
      }
      return;
    }

    // `hint` pode ter sido montada antes de o loader terminar. Recria as etapas
    // depois da carga para nunca entregar as chaves cruas ao `BdTourService`.
    const translatedHint = this.pageHints().find((item) => item.id === hint.id);
    if (!translatedHint) {
      this.preparingStage.set(false);
      this.activePageHint.set(null);
      return;
    }

    const steps = await this.resolveVisibleSteps(translatedHint.steps, currentRunId);
    if (currentRunId !== this.runId) return;

    this.preparingStage.set(false);
    if (!steps.length || this.router.url.split('?')[0] !== translatedHint.route) {
      this.activePageHint.set(null);
      return;
    }

    this.openTour(steps, 'page-hint');
  }

  /** Garante que `translate()` devolva texto, não a chave, antes de abrir o tour. */
  private async loadActiveTranslations(): Promise<boolean> {
    try {
      await firstValueFrom(this.transloco.load(this.transloco.getActiveLang()));
      return true;
    } catch {
      // Sem as traduções, é melhor não abrir a dica do que expor as chaves da interface.
      return false;
    }
  }

  private canShowPageHint(id: PageHintId): boolean {
    return Boolean(
      this.currentUserId &&
      // Dicas contextuais complementam uma introdução concluída. Nunca podem
      // concorrer com as boas-vindas, um tour em andamento ou um onboarding pulado.
      this.currentOnboardingStatus === 'completed' &&
      !this.hasSeenPageHint(id) &&
      !this.tour.active() &&
      !this.awaitingOutcome() &&
      !this.preparingStage() &&
      !this.activePageHint(),
    );
  }

  private cancelPendingPageHint(): void {
    if (!this.activePageHint()) return;

    this.runId += 1;
    this.preparingStage.set(false);
    this.activePageHint.set(null);
    this.clearSpotShape();
  }

  private hasSeenPageHint(id: PageHintId): boolean {
    return (
      this.sessionPageHints.has(this.pageHintSessionKey(id)) || this.readPageHints()[id] === true
    );
  }

  private markPageHintSeen(id: PageHintId): void {
    if (!this.currentUserId) return;

    this.sessionPageHints.add(this.pageHintSessionKey(id));
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const hints = this.readPageHints();
      hints[id] = true;
      window.localStorage.setItem(this.pageHintsStorageKey(), JSON.stringify(hints));
    } catch {
      // Em modo privado ou com armazenamento indisponível, a memória da sessão evita repetição.
    }
  }

  private readPageHints(): Partial<Record<PageHintId, true>> {
    if (!isPlatformBrowser(this.platformId) || !this.currentUserId) return {};

    try {
      const saved = window.localStorage.getItem(this.pageHintsStorageKey());
      if (!saved) return {};

      const parsed: unknown = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  private pageHintsStorageKey(): string {
    return `${PAGE_HINTS_STORAGE_PREFIX}${this.currentUserId}`;
  }

  private pageHintSessionKey(id: PageHintId): string {
    return `${this.currentUserId}:${id}`;
  }

  private async resolveVisibleSteps(
    steps: readonly OnboardingStage[],
    currentRunId: number,
  ): Promise<ActiveTourStep[]> {
    if (!isPlatformBrowser(this.platformId)) return [];

    const deadline = Date.now() + TARGET_WAIT_TIMEOUT_MS;
    do {
      const visibleSteps = this.findVisibleSteps(steps);
      if (visibleSteps.length) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, TARGET_RETRY_INTERVAL_MS));
        return this.findVisibleSteps(steps);
      }

      await new Promise<void>((resolve) => window.setTimeout(resolve, TARGET_RETRY_INTERVAL_MS));
    } while (Date.now() < deadline && currentRunId === this.runId);

    return [];
  }

  private findVisibleSteps(steps: readonly OnboardingStage[]): ActiveTourStep[] {
    return steps.flatMap((step) => {
      const target = this.findVisibleTarget(step.targets);
      return target ? [{ ...step, target, placement: 'auto' as const }] : [];
    });
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
