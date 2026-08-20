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
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Subject, finalize, forkJoin, takeUntil } from 'rxjs';
import { LucideUtensils, type LucideIcon } from '@lucide/angular';

import { BackButtonComponent } from '../../../components/molecules/back-button/back-button.component';
import { ConfirmDialogComponent } from '../../../components/molecules/confirm-dialog/confirm-dialog.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { MealPlateComponent } from '../../../components/molecules/meal-plate/meal-plate.component';
import { NutritionRevealComponent } from '../../../components/molecules/nutrition-reveal/nutrition-reveal.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import type { PlateItem } from '../../../components/molecules/plate-row/plate-row.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { somarMacros, escalarMacros } from '../../../components/utils/diary-day.util';
import { LanguageService } from '../../../core/i18n/language.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import { horariosPadrao } from '../../../core/meal-plan/meal-plan-times.util';
import type {
  MealPlanDraft,
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
  MealPlanStyle,
} from '../../../core/models/meal-plan.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanPreviewComponent } from '../meal-plan-preview/meal-plan-preview.component';
import { RefeicoesStepComponent } from '../dieta-form/steps/refeicoes-step/refeicoes-step.component';
import { MealBuilderComponent } from './meal-builder/meal-builder.component';

interface RefeicaoLocal {
  items: PlateItem[];
}

const TEMPO_REVELACAO_MS = 1400;

/**
 * Fluxo manual de criação de plano alimentar — alternativa ao gerador por IA
 * (`DietaFormComponent`). Mesma trilha de macros/quantidades/preview, mas o
 * usuário escolhe cada alimento em cada refeição; o backend só entra em cena
 * no fim (`MealPlanService.manualPreview`), pra montar o rascunho definitivo.
 */
@Component({
  selector: 'vtp-manual-dieta-form',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslocoPipe,
    BackButtonComponent,
    ConfirmDialogComponent,
    LoadingStateComponent,
    LoadingOverlayComponent,
    MealPlateComponent,
    MealPlanPreviewComponent,
    NutritionRevealComponent,
    PageTitleComponent,
    RefeicoesStepComponent,
    MealBuilderComponent,
    StepTrackComponent,
  ],
  templateUrl: './manual-dieta-form.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDietaFormComponent implements OnDestroy {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly diaryDraft = inject(MealPlanDiaryDraftService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);
  /** Regra do sistema: toda subscription de chamada à API é encerrada ao sair do
   * componente — `takeUntil(this.destruido)` em cada `.subscribe()`. */
  private readonly destruido = new Subject<void>();
  private revelacaoTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly meta = signal<MetaDiaria | null>(null);

  protected readonly mode = signal<'form' | 'build' | 'preview'>('form');
  protected readonly mealCount = signal<3 | 4 | 5>(4);
  protected readonly refeicoesLocais = signal<RefeicaoLocal[]>([]);
  protected readonly mealAtivo = signal(0);
  protected readonly confirmAjustarAberto = signal(false);

  protected readonly passosTopo = computed<StepTrackItem[]>(() => {
    this.language.locale();
    return (['meals', 'build'] as const).map((step) => ({
      titulo: this.transloco.translate(`dietPlan.manual.steps.${step}.title`),
      descricao: this.transloco.translate(`dietPlan.manual.steps.${step}.description`),
    }));
  });
  protected readonly passoTopoAtivo = computed(() => (this.mode() === 'form' ? 0 : 1));

  protected readonly building = signal(false);
  protected readonly revelando = signal(false);
  protected readonly mensagensBuilding = computed<string[]>(() => {
    this.language.locale();
    return [
      this.transloco.translate('dietPlan.manual.building.step1'),
      this.transloco.translate('dietPlan.manual.building.step2'),
      this.transloco.translate('dietPlan.manual.building.step3'),
    ];
  });

  protected readonly draft = signal<MealPlanDraft | null>(null);
  protected readonly title = signal('');
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly editando = signal(false);
  protected readonly planoEmEdicaoId = signal<number | null>(null);

  protected readonly regeneratingMeal = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly applyingChange = signal(false);
  protected readonly swapTarget = signal<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);
  protected readonly suggestions = signal<MealPlanItemSuggestion[]>([]);
  protected readonly swapFailureMessage = signal<string | null>(null);

  /** Refeições do "prédio" da mesa de montagem — mesmo formato de `MealPlanMeal`
   * pra reaproveitar `MealPlateComponent` sem modificação; `target` fica zerado
   * porque ainda não existe meta por refeição (só depois do backend gerar o
   * rascunho manual, na fase `preview`). */
  protected readonly mealsView = computed<MealPlanMeal[]>(() => {
    const horarios = horariosPadrao(this.mealCount());
    return this.refeicoesLocais().map((refeicao, indice) => ({
      position: indice,
      descricao: this.transloco.translate('dietPlan.manual.mealLabel', { n: indice + 1 }),
      horario: horarios[indice] ?? '',
      target: { caloria: 0, proteina: 0, carbo: 0, gordura: 0 },
      totals: somarMacros(
        refeicao.items.map((item) => ({
          macros: escalarMacros(item.macrosRef, item.qtdRef, item.quantity),
        })),
      ),
      items: [],
    }));
  });

  protected readonly iconeRefeicao: LucideIcon = LucideUtensils;

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
    if (this.revelacaoTimeoutId !== null) clearTimeout(this.revelacaoTimeoutId);
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

  protected onRefeicoesConcluido(valor: 3 | 4 | 5): void {
    this.mealCount.set(valor);
    this.refeicoesLocais.set(Array.from({ length: valor }, () => ({ items: [] })));
    this.mealAtivo.set(0);
    this.mode.set('build');
  }

  /** "Ajustar preferências" no preview volta pro passo de qtd de refeições —
   * mas reenviar esse passo (`onRefeicoesConcluido`) zera `refeicoesLocais`
   * inteiro. Se já existe alimento escolhido em alguma refeição, confirma
   * antes de descartar (mesmo padrão de ação destrutiva do resto do
   * sistema — `ConfirmDialogComponent`), em vez de perder silenciosamente. */
  protected pedirAjustarPreferencias(): void {
    const temAlgo = this.refeicoesLocais().some((refeicao) => refeicao.items.length > 0);
    if (!temAlgo) {
      this.mode.set('form');
      return;
    }
    this.confirmAjustarAberto.set(true);
  }

  protected cancelarAjustarPreferencias(): void {
    this.confirmAjustarAberto.set(false);
  }

  protected confirmarAjustarPreferencias(): void {
    this.confirmAjustarAberto.set(false);
    this.mode.set('form');
  }

  protected onItensChange(items: PlateItem[]): void {
    const indice = this.mealAtivo();
    this.refeicoesLocais.update((lista) =>
      lista.map((refeicao, i) => (i === indice ? { items } : refeicao)),
    );
  }

  protected onVoltarFaseMeal(): void {
    const indice = this.mealAtivo();
    if (indice === 0) {
      this.mode.set('form');
      return;
    }
    this.mealAtivo.set(indice - 1);
  }

  protected onConcluirMeal(items: PlateItem[]): void {
    const indice = this.mealAtivo();
    this.refeicoesLocais.update((lista) =>
      lista.map((refeicao, i) => (i === indice ? { items } : refeicao)),
    );

    if (indice < this.mealCount() - 1) {
      this.mealAtivo.set(indice + 1);
      return;
    }

    this.buildManualPreview();
  }

  protected irParaMeal(indice: number): void {
    if (indice < 0 || indice >= this.mealCount()) return;
    this.mealAtivo.set(indice);
  }

  private buildManualPreview(): void {
    if (this.building()) return;
    const mealCount = this.mealCount();
    const horarios = horariosPadrao(mealCount);
    const meals = this.refeicoesLocais().map((refeicao, indice) => ({
      position: indice,
      horario: horarios[indice] ?? '',
      items: refeicao.items.map((item) => ({ food_id: item.foodId, quantity: item.quantity })),
    }));

    this.building.set(true);
    this.plansService
      .manualPreview({ meal_count: mealCount, meal_times: horarios, meals })
      .pipe(
        finalize(() => this.building.set(false)),
        takeUntil(this.destruido),
      )
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.dirty.set(true);
          this.revelarEIrParaPreview();
        },
        error: () => undefined,
      });
  }

  private revelarEIrParaPreview(): void {
    const reduzMovimento =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzMovimento) {
      this.mode.set('preview');
      return;
    }
    this.revelando.set(true);
    this.revelacaoTimeoutId = setTimeout(() => {
      this.revelando.set(false);
      this.mode.set('preview');
    }, TEMPO_REVELACAO_MS);
  }

  protected useMealFromDrawer(meal: MealPlanMeal): void {
    const current = this.draft();
    const mealIndex = current?.meals.findIndex((item) => item.position === meal.position) ?? -1;
    this.diaryDraft.prepare(0, meal.items);
    this.router.navigate(['/diario'], {
      queryParams: { registrar: 1, planMeal: mealIndex >= 0 ? mealIndex : null },
    });
  }

  protected onTituloChange(valor: string): void {
    this.title.set(valor);
    this.dirty.set(true);
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

  private iniciar(): void {
    const planoId = this.route.snapshot.queryParamMap.get('planoId');
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
          // `refeicoesLocais` precisa refletir o draft carregado — senão
          // "Ajustar preferências" acha que não há nada escolhido (array
          // vazio no estado inicial) e pula a confirmação de descarte,
          // reconstruindo o plano do zero e sobrescrevendo o original em
          // `save()` sem aviso nenhum.
          const meals = [...draft.meals].sort((a, b) => a.position - b.position);
          this.mealCount.set((meals.length as 3 | 4 | 5) || this.mealCount());
          this.refeicoesLocais.set(
            meals.map((meal) => ({
              items: meal.items.map(
                (item): PlateItem => ({
                  foodId: item.food_id,
                  descricao: item.descricao,
                  detalheExibicao: item.detalhe_exibicao ?? null,
                  illustrationKey: null,
                  quantity: item.quantity,
                  qtdRef: item.quantity,
                  macrosRef: item.macros,
                  porcaoBase: item.quantity,
                }),
              ),
            })),
          );
          this.mealAtivo.set(0);
        },
        error: () => {
          this.toastr.error(this.transloco.translate('dietPlan.toast.loadForEditError'));
          this.router.navigateByUrl('/dietas');
        },
      });
  }
}
