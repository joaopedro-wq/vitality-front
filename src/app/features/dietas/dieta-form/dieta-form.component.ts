import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Subject, finalize, forkJoin, switchMap, takeUntil } from 'rxjs';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import { horariosPadrao } from '../../../core/meal-plan/meal-plan-times.util';
import { LanguageService } from '../../../core/i18n/language.service';
import type { Alimento } from '../../../core/models/alimento.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import type {
  MealPlanDraft,
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
  MealPlanPreferences,
  MealPlanStyle,
} from '../../../core/models/meal-plan.model';
import { MealPlanPreviewComponent } from '../meal-plan-preview/meal-plan-preview.component';
import { RefeicoesStepComponent } from './steps/refeicoes-step/refeicoes-step.component';
import { EstiloStepComponent } from './steps/estilo-step/estilo-step.component';
import { PreferenciasStepComponent } from './steps/preferencias-step/preferencias-step.component';
import { RevisarStepComponent } from './steps/revisar-step/revisar-step.component';

@Component({
  selector: 'vtp-dieta-form',
  standalone: true,
  imports: [
    DecimalPipe,
    BackButtonComponent,
    LoadingStateComponent,
    PageTitleComponent,
    StepTrackComponent,
    LoadingOverlayComponent,
    MealPlanPreviewComponent,
    RefeicoesStepComponent,
    EstiloStepComponent,
    PreferenciasStepComponent,
    RevisarStepComponent,
    TranslocoPipe,
  ],
  templateUrl: './dieta-form.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaFormComponent implements OnDestroy {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly diaryDraft = inject(MealPlanDiaryDraftService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  /** Regra do sistema: toda subscription de chamada à API é encerrada ao sair do
   * componente — `takeUntil(this.destruido)` em cada `.subscribe()`, mesmo padrão
   * de `EntryComposerComponent`. Sem isso, uma resposta que chega depois do usuário
   * navegar pra outra tela ainda escreve em signals de um componente morto. */
  private readonly destruido = new Subject<void>();

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly generating = signal(false);
  protected readonly mensagensGeracao = computed<string[]>(() => {
    this.language.locale();

    return [
      this.transloco.translate('dietPlan.generating.step1'),
      this.transloco.translate('dietPlan.generating.step2'),
      this.transloco.translate('dietPlan.generating.step3'),
      this.transloco.translate('dietPlan.generating.step4'),
    ];
  });
  protected readonly saving = signal(false);
  protected readonly regeneratingMeal = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly applyingChange = signal(false);
  protected readonly mode = signal<'form' | 'preview'>('form');
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly draft = signal<MealPlanDraft | null>(null);
  protected readonly mealCount = signal<3 | 4 | 5>(4);
  protected readonly style = signal<MealPlanStyle>('rapido');
  protected readonly title = signal('');
  protected readonly excluded = signal<Alimento[]>([]);
  protected readonly included = signal<Alimento[]>([]);
  protected readonly swapTarget = signal<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);
  protected readonly suggestions = signal<MealPlanItemSuggestion[]>([]);
  protected readonly swapFailureMessage = signal<string | null>(null);
  protected readonly passo = signal(0);
  protected readonly passosForm = computed<StepTrackItem[]>(() => {
    this.language.locale();

    return (['meals', 'style', 'preferences', 'review'] as const).map((step) => ({
      titulo: this.transloco.translate(`dietPlan.steps.${step}.title`),
      descricao: this.transloco.translate(`dietPlan.steps.${step}.description`),
    }));
  });
  protected readonly editando = signal(false);
  protected readonly planoEmEdicaoId = signal<number | null>(null);

  protected readonly dirty = signal(false);

  /** `effect()` roda uma vez na inicialização também — pula o primeiro disparo pra
   * não tentar retraduzir um draft que ainda nem existe. */
  private idiomaInicializado = false;

  constructor() {
    this.iniciar();

    effect(() => {
      this.language.locale();
      if (!this.idiomaInicializado) {
        this.idiomaInicializado = true;

        return;
      }
      untracked(() => this.refreshDraftLocale());
    });
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  private refreshDraftLocale(): void {
    const draft = this.draft();
    if (this.mode() !== 'preview' || !draft) return;
    this.plansService
      .refreshLocale(draft.draft_id)
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: (refreshed) => this.draft.set(refreshed),
        error: () => undefined,
      });
  }

  protected onTituloChange(valor: string): void {
    this.title.set(valor);
    this.dirty.set(true);
  }

  protected irParaPasso(indice: number): void {
    this.passo.set(indice);
  }

  protected onRefeicoesConcluido(valor: 3 | 4 | 5): void {
    this.mealCount.set(valor);
    this.passo.set(1);
  }

  protected onEstiloConcluido(valor: MealPlanStyle): void {
    this.style.set(valor);
    this.passo.set(2);
  }

  protected onPreferenciasConcluido(valor: { evitados: Alimento[]; incluidos: Alimento[] }): void {
    this.excluded.set(valor.evitados);
    this.included.set(valor.incluidos);
    this.passo.set(3);
  }

  protected generate(): void {
    const preferences: MealPlanPreferences = {
      meal_count: this.mealCount(),
      meal_times: horariosPadrao(this.mealCount()),
      style: this.style(),
      excluded_food_ids: this.excluded().map((food) => food.id),
      included_food_ids: this.included().map((food) => food.id),
      diet_type: 'onivora',
      restriction_slugs: [],
    };
    this.generating.set(true);
    this.plansService
      .saveProfile(preferences)
      .pipe(
        switchMap(() => this.plansService.preview(preferences)),
        finalize(() => this.generating.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
          this.dirty.set(true);
          this.closeSwap();
        },
        error: () => undefined,
      });
  }

  protected save(): void {
    const draft = this.draft();
    const titulo = this.title().trim();
    if (!draft || !titulo || this.saving()) return;
    this.saving.set(true);
    const planoId = this.planoEmEdicaoId();
    const request = planoId
      ? this.plansService.update(planoId, { titulo, draft_id: draft.draft_id })
      : this.plansService.save({ titulo, draft_id: draft.draft_id });
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: () => {
          this.dirty.set(false);
          this.toastr.success(this.transloco.translate('dietPlan.toast.saved'));
          this.router.navigateByUrl('/dietas');
        },
        error: () => undefined,
      });
  }

  protected regenerateMeal(position: number): void {
    const current = this.draft();
    if (!current || this.regeneratingMeal() !== null) return;
    this.regeneratingMeal.set(position);
    this.plansService
      .regenerateMeal(current.draft_id, position)
      .pipe(
        finalize(() => this.regeneratingMeal.set(null)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.swapTarget.set(null);
          this.swapFailureMessage.set(null);
          this.dirty.set(true);
          this.toastr.success(this.transloco.translate('dietPlan.toast.mealRegenerated'));
        },
        error: () => undefined,
      });
  }

  protected openItemSwap(target: { meal: MealPlanMeal; item: MealPlanItem }): void {
    this.swapTarget.set(target);
    this.suggestions.set([]);
    this.swapFailureMessage.set(null);
  }

  protected closeSwap(): void {
    this.swapTarget.set(null);
    this.suggestions.set([]);
    this.swapFailureMessage.set(null);
  }

  protected loadSuggestions(): void {
    const draft = this.draft();
    const target = this.swapTarget();
    if (!draft || !target || this.suggesting()) return;
    this.suggesting.set(true);
    this.swapFailureMessage.set(null);
    this.plansService
      .itemSuggestions(draft.draft_id, target.meal.position, target.item.food_id)
      .pipe(
        finalize(() => this.suggesting.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (suggestions) => this.suggestions.set(suggestions),
        error: (error) => this.swapFailureMessage.set(this.extractSwapFailureMessage(error)),
      });
  }

  protected applySuggestion(suggestion: MealPlanItemSuggestion): void {
    const draft = this.draft();
    const target = this.swapTarget();
    if (!draft || !target || this.applyingChange()) return;
    this.applyingChange.set(true);
    this.plansService
      .replaceItem(
        draft.draft_id,
        target.meal.position,
        target.item.food_id,
        suggestion.food_id,
        suggestion.quantity,
      )
      .pipe(
        finalize(() => this.applyingChange.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (updated) => {
          this.draft.set(updated);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success(this.transloco.translate('dietPlan.toast.itemReplaced'));
        },
        error: () => undefined,
      });
  }

  private extractSwapFailureMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const errors = error.error?.errors as Record<string, string[] | string> | undefined;
      const first = errors ? Object.values(errors)[0] : null;
      const message = Array.isArray(first) ? first[0] : first;
      if (message) return message;
      if (typeof error.error?.message === 'string') return error.error.message;
    }

    return this.transloco.translate('dietPlan.swapFailureFallback');
  }

  protected recreateDay(): void {
    const current = this.draft();
    if (!current || this.applyingChange()) return;
    if (!window.confirm(this.transloco.translate('dietPlan.confirmRecreate'))) return;
    this.applyingChange.set(true);
    this.plansService
      .recreate(current.draft_id)
      .pipe(
        finalize(() => this.applyingChange.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success(this.transloco.translate('dietPlan.toast.dayRecreated'));
        },
        error: () => undefined,
      });
  }

  protected undo(): void {
    const current = this.draft();
    if (!current || this.applyingChange()) return;
    this.applyingChange.set(true);
    this.plansService
      .undo(current.draft_id)
      .pipe(
        finalize(() => this.applyingChange.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.dirty.set(true);
          this.closeSwap();
          this.toastr.success(this.transloco.translate('dietPlan.toast.undone'));
        },
        error: () => undefined,
      });
  }

  protected useMealFromDrawer(meal: MealPlanMeal): void {
    const current = this.draft();
    const mealIndex = current?.meals.findIndex((item) => item.position === meal.position) ?? -1;
    this.diaryDraft.prepare(0, meal.items);
    this.router.navigate(['/diario'], {
      queryParams: { registrar: 1, planMeal: mealIndex >= 0 ? mealIndex : null },
    });
  }

  private iniciar(): void {
    const planoId = this.route.snapshot.queryParamMap.get('planoId');
    // Vazio ao criar — o usuário escolhe o nome, não vem pré-preenchido com um
    // título genérico. Editando um plano existente, `carregarParaEdicao()`
    // preenche com o `titulo` de verdade vindo do backend (`draft.titulo`).
    this.title.set('');
    forkJoin({
      metas: this.metaService.list(),
      profile: this.plansService.profile(),
    })
      .pipe(takeUntil(this.destruido))
      .subscribe({
        next: ({ metas, profile }) => {
          const metaAtual = metas.find((item) => item.data === null) ?? metas[0] ?? null;
          this.meta.set(metaAtual);
          this.mealCount.set(profile.meal_count);
          this.style.set(profile.style);

          if (!metaAtual) {
            this.router.navigateByUrl('/metas');
            return;
          }
          if (planoId) {
            this.carregarParaEdicao(Number(planoId));
          } else {
            this.loading.set(false);
          }
        },
        error: () => {
          this.toastr.error(this.transloco.translate('dietPlan.toast.loadPreferencesError'));
          this.loading.set(false);
        },
      });
  }

  private carregarParaEdicao(id: number): void {
    this.plansService
      .editDraft(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.title.set(draft.titulo ?? '');
          this.mode.set('preview');
          this.editando.set(true);
          this.planoEmEdicaoId.set(id);
          this.dirty.set(false);
        },
        error: () => {
          this.toastr.error(this.transloco.translate('dietPlan.toast.loadForEditError'));
          this.router.navigateByUrl('/dietas');
        },
      });
  }
}
