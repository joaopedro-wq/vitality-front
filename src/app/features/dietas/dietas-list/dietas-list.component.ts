import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent, BdModalComponent } from 'bandeira-ui';
import { LucideArrowLeft, LucideCheck, LucidePlus, LucideSparkles } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, switchMap } from 'rxjs';

import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { LoadingStateComponent } from '../../../components/molecules/loading-state/loading-state.component';
import { PageTitleComponent } from '../../../components/molecules/page-title/page-title.component';
import { LoadingOverlayComponent } from '../../../components/organisms/loading-overlay/loading-overlay.component';
import { gateCarregamento } from '../../../components/utils/loading-gate.util';
import { AlimentoService } from '../../../services/alimento.service';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import type { Alimento } from '../../../core/models/alimento.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import type {
  MealPlan,
  MealPlanDraft,
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
  MealPlanPreferences,
  MealPlanStyle,
} from '../../../core/models/meal-plan.model';

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

@Component({
  selector: 'vtp-dietas-list',
  standalone: true,
  imports: [
    DecimalPipe,
    BdButtonComponent,
    BdModalComponent,
    LucideArrowLeft,
    LucideCheck,
    LucidePlus,
    LucideSparkles,
    PlateLoaderComponent,
    LoadingStateComponent,
    PageTitleComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './dietas-list.component.html',
  styleUrl: './dietas-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DietasListComponent {
  private readonly plansService = inject(MealPlanService);
  private readonly metaService = inject(MetaService);
  private readonly foodsService = inject(AlimentoService);
  private readonly diaryDraft = inject(MealPlanDiaryDraftService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  protected readonly loading = signal(true);
  protected readonly loadingVisivel = gateCarregamento(this.loading);
  protected readonly generating = signal(false);
  protected readonly mensagensGeracao = MENSAGENS_GERACAO;
  protected readonly saving = signal(false);
  protected readonly regeneratingMeal = signal<number | null>(null);
  protected readonly suggesting = signal(false);
  protected readonly applyingChange = signal(false);
  protected readonly mode = signal<'list' | 'form' | 'preview'>('list');
  protected readonly meta = signal<MetaDiaria | null>(null);
  protected readonly plans = signal<MealPlan[]>([]);
  protected readonly draft = signal<MealPlanDraft | null>(null);
  protected readonly mealCount = signal<3 | 4 | 5>(4);
  protected readonly style = signal<MealPlanStyle>('rapido');
  protected readonly title = signal('Meu plano do dia');
  protected readonly excluded = signal<Alimento[]>([]);
  protected readonly foodSearch = signal('');
  protected readonly foodResults = signal<Alimento[]>([]);
  protected readonly swapTarget = signal<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);
  protected readonly suggestions = signal<MealPlanItemSuggestion[]>([]);

  protected readonly hasMeta = computed(() => this.meta() !== null);
  protected readonly mealTimes = computed(() => TIMES[this.mealCount()]);

  constructor() {
    this.load();
  }

  protected openGenerator(): void {
    if (!this.hasMeta()) {
      this.router.navigateByUrl('/metas');
      return;
    }
    this.draft.set(null);
    this.mode.set('form');
  }

  protected setMealCount(value: number): void {
    this.mealCount.set(value as 3 | 4 | 5);
  }

  protected setStyle(value: string): void {
    this.style.set(value as MealPlanStyle);
  }

  protected searchFoods(value: string): void {
    const search = value.trim();
    this.foodSearch.set(value);
    if (search.length < 2) {
      this.foodResults.set([]);
      return;
    }
    this.foodsService.list({ search, page: 1 }).subscribe({
      next: (page) =>
        this.foodResults.set(page.data.filter((food) => !this.isExcluded(food.id)).slice(0, 6)),
      error: () => this.foodResults.set([]),
    });
  }

  protected addExcluded(food: Alimento): void {
    if (!this.isExcluded(food.id)) this.excluded.update((foods) => [...foods, food]);
    this.foodSearch.set('');
    this.foodResults.set([]);
  }

  protected removeExcluded(id: number): void {
    this.excluded.update((foods) => foods.filter((food) => food.id !== id));
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
        next: (plan) => {
          this.plans.update((plans) => [plan, ...plans]);
          this.mode.set('list');
          this.draft.set(null);
          this.toastr.success('Plano alimentar salvo.');
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

  protected onSwapModalOpenChange(open: boolean): void {
    if (!open) this.closeSwap();
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

  protected editPlan(plan: MealPlan): void {
    if (this.generating()) return;
    this.generating.set(true);
    this.plansService
      .editDraft(plan.id)
      .pipe(finalize(() => this.generating.set(false)))
      .subscribe({
        next: (draft) => {
          this.draft.set(draft);
          this.mode.set('preview');
        },
        error: () => undefined,
      });
  }

  protected useMeal(plan: MealPlan, mealIndex: number): void {
    const plannedMeal = plan.meals[mealIndex];
    if (!plannedMeal) return;
    this.diaryDraft.prepare(0, plannedMeal.items);
    this.router.navigate(['/diario'], {
      queryParams: { registrar: 1, planMeal: mealIndex, plan: plan.id },
    });
  }

  protected archive(plan: MealPlan): void {
    this.plansService.archive(plan.id).subscribe({
      next: () => {
        this.plans.update((plans) => plans.filter((item) => item.id !== plan.id));
        this.toastr.success('Plano arquivado.');
      },
      error: () => undefined,
    });
  }

  protected backToList(): void {
    this.mode.set('list');
  }

  protected formatStyle(style: MealPlanStyle): string {
    return { rapido: 'Rápido', caseiro: 'Caseiro', economico: 'Econômico' }[style];
  }

  private isExcluded(id: number): boolean {
    return this.excluded().some((food) => food.id === id);
  }

  private load(): void {
    forkJoin({
      metas: this.metaService.list(),
      plans: this.plansService.list(),
      profile: this.plansService.profile(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ metas, plans, profile }) => {
          this.meta.set(metas.find((item) => item.data === null) ?? metas[0] ?? null);
          this.plans.set(plans.filter((plan) => !plan.archived_at));
          this.mealCount.set(profile.meal_count);
          this.style.set(profile.style);
        },
        error: () => this.toastr.error('Não foi possível carregar seus planos agora.'),
      });
  }
}
