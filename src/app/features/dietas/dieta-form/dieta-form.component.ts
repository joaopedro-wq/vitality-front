import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideMoon,
  LucideSun,
  LucideSunrise,
  LucideSunset,
  type LucideIcon,
} from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { MealPlateComponent } from '../../../components/molecules/meal-plate/meal-plate.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import {
  StepTrackComponent,
  type StepTrackItem,
} from '../../../components/molecules/step-track/step-track.component';
import { MealDrawerComponent } from '../../../components/organisms/meal-drawer/meal-drawer.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
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
import { RefeicoesStepComponent } from './steps/refeicoes-step/refeicoes-step.component';
import { EstiloStepComponent } from './steps/estilo-step/estilo-step.component';
import { EvitarStepComponent } from './steps/evitar-step/evitar-step.component';
import { RevisarStepComponent } from './steps/revisar-step/revisar-step.component';

const MENSAGENS_GERACAO: string[] = [
  'Escolhendo alimentos para o seu dia…',
  'Equilibrando proteína, carbo e gordura…',
  'Encaixando nos horários das refeições…',
  'Conferindo se bate com a sua meta…',
];

const TIMES: Record<3 | 4 | 5, string[]> = {
  3: ['08:00', '12:30', '19:30'],
  4: ['08:00', '12:30', '16:30', '20:00'],
  5: ['07:30', '10:30', '13:00', '16:30', '20:00'],
};

/** Ícone de período por horário — nunca emoji, sempre um Lucide de verdade. */
const ICONES_PERIODO: ReadonlyArray<readonly [limite: number, icone: LucideIcon]> = [
  [10, LucideSunrise],
  [15, LucideSun],
  [18, LucideSunset],
  [24, LucideMoon],
];

const PASSOS_FORM: StepTrackItem[] = [
  { titulo: 'Refeições', descricao: 'Quantas por dia' },
  { titulo: 'Estilo', descricao: 'O que ajuda na rotina' },
  { titulo: 'Evitar', descricao: 'Opcional' },
  { titulo: 'Revisar', descricao: 'Confere antes de gerar' },
];

/**
 * Gerar/editar um plano — quiz de preferências (trilha horizontal) seguido da
 * prévia (fila de pratos + gaveta de ingredientes). Vive na própria rota
 * (`/dietas/novo`, com `?planoId=` para editar um plano salvo) porque é um
 * fluxo autocontido demais para continuar dividindo `mode` com a lista.
 */
@Component({
  selector: 'vtp-dieta-form',
  standalone: true,
  imports: [
    DecimalPipe,
    BdButtonComponent,
    LucideArrowLeft,
    LucideCheck,
    PlateLoaderComponent,
    LoadingStateComponent,
    MealPlateComponent,
    MealDrawerComponent,
    PageTitleComponent,
    StepTrackComponent,
    LoadingOverlayComponent,
    RefeicoesStepComponent,
    EstiloStepComponent,
    EvitarStepComponent,
    RevisarStepComponent,
  ],
  templateUrl: './dieta-form.component.html',
  host: { class: 'block p-8 max-sm:p-4' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietaFormComponent {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly diaryDraft = inject(MealPlanDiaryDraftService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly generating = signal(false);
  protected readonly mensagensGeracao = MENSAGENS_GERACAO;
  protected readonly saving = signal(false);
  protected readonly regeneratingMeal = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly applyingChange = signal(false);
  protected readonly mode = signal<'form' | 'preview'>('form');
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly draft = signal<MealPlanDraft | null>(null);
  protected readonly mealCount = signal<3 | 4 | 5>(4);
  protected readonly style = signal<MealPlanStyle>('rapido');
  protected readonly title = signal('Meu plano do dia');
  protected readonly excluded = signal<Alimento[]>([]);
  protected readonly swapTarget = signal<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);
  protected readonly suggestions = signal<MealPlanItemSuggestion[]>([]);
  protected readonly pratoAberto = signal<number | null>(null);
  protected readonly passo = signal(0);
  protected readonly passosForm = PASSOS_FORM;

  protected readonly pratoAtivo = computed(() => {
    const aberto = this.pratoAberto();
    if (aberto === null) return null;
    return this.draft()?.meals.find((meal) => meal.position === aberto) ?? null;
  });

  constructor() {
    this.iniciar();
  }

  protected togglePrato(position: number): void {
    if (this.pratoAberto() === position) {
      this.pratoAberto.set(null);
      return;
    }
    this.pratoAberto.set(position);
    this.swapTarget.set(null);
    this.suggestions.set([]);
  }

  protected fecharGaveta(): void {
    this.pratoAberto.set(null);
    this.closeSwap();
  }

  protected iconePeriodo(horario: string): LucideIcon {
    const hora = Number(horario.split(':')[0]);
    return ICONES_PERIODO.find(([limite]) => hora < limite)?.[1] ?? LucideMoon;
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

  protected onEvitarConcluido(itens: Alimento[]): void {
    this.excluded.set(itens);
    this.passo.set(3);
  }

  protected generate(): void {
    const preferences: MealPlanPreferences = {
      meal_count: this.mealCount(),
      meal_times: TIMES[this.mealCount()],
      style: this.style(),
      excluded_food_ids: this.excluded().map((food) => food.id),
      diet_type: 'onivora',
      restriction_slugs: [],
    };
    this.generating.set(true);
    this.plansService
      .saveProfile(preferences)
      .pipe(switchMap(() => this.plansService.preview(preferences)))
      .pipe(finalize(() => this.generating.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
          this.pratoAberto.set(draft.meals[0]?.position ?? null);
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
    this.plansService
      .save({ titulo, draft_id: draft.draft_id })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Plano alimentar salvo.');
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
      .pipe(finalize(() => this.regeneratingMeal.set(null)))
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.swapTarget.set(null);
          this.toastr.success('Refeição reorganizada com uma nova combinação.');
        },
        error: () => undefined,
      });
  }

  protected openItemSwap(meal: MealPlanMeal, item: MealPlanItem): void {
    this.swapTarget.set({ meal, item });
    this.suggestions.set([]);
  }

  protected closeSwap(): void {
    this.swapTarget.set(null);
    this.suggestions.set([]);
  }

  protected loadSuggestions(): void {
    const draft = this.draft();
    const target = this.swapTarget();
    if (!draft || !target || this.suggesting()) return;
    this.suggesting.set(true);
    this.plansService
      .itemSuggestions(draft.draft_id, target.meal.position, target.item.food_id)
      .pipe(finalize(() => this.suggesting.set(false)))
      .subscribe({
        next: (suggestions) => this.suggestions.set(suggestions),
        error: () => undefined,
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
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (updated) => {
          this.draft.set(updated);
          this.closeSwap();
          this.toastr.success('Alimento substituído mantendo a meta da refeição.');
        },
        error: () => undefined,
      });
  }

  protected recreateDay(): void {
    const current = this.draft();
    if (!current || this.applyingChange()) return;
    if (
      !window.confirm(
        'Gerar uma nova versão do dia? A prévia atual continuará disponível até você salvar a nova.',
      )
    )
      return;
    this.applyingChange.set(true);
    this.plansService
      .recreate(current.draft_id)
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (replacement) => {
          this.draft.set(replacement);
          this.closeSwap();
          this.toastr.success('Nova versão do plano criada.');
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
      .pipe(finalize(() => this.applyingChange.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.closeSwap();
          this.toastr.success('Última alteração desfeita.');
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

  protected voltarParaLista(): void {
    this.router.navigateByUrl('/dietas');
  }

  private iniciar(): void {
    const planoId = this.route.snapshot.queryParamMap.get('planoId');
    forkJoin({
      metas: this.metaService.list(),
      profile: this.plansService.profile(),
    }).subscribe({
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
        this.toastr.error('Não foi possível carregar suas preferências agora.');
        this.loading.set(false);
      },
    });
  }

  private carregarParaEdicao(id: number): void {
    this.plansService
      .editDraft(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
          this.pratoAberto.set(draft.meals[0]?.position ?? null);
        },
        error: () => {
          this.toastr.error('Não foi possível abrir esse plano para edição.');
          this.router.navigateByUrl('/dietas');
        },
      });
  }
}
