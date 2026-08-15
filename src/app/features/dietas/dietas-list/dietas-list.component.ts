import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { LucideArrowLeft, LucideCheck, LucidePlus, LucideSparkles } from '@lucide/angular';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin } from 'rxjs';

import { AlimentoService } from '../../../services/alimento.service';
import { MealPlanService } from '../../../services/meal-plan.service';
import { MetaService } from '../../../services/meta.service';
import { MealPlanDiaryDraftService } from '../../../core/meal-plan/meal-plan-diary-draft.service';
import type { Alimento } from '../../../core/models/alimento.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';
import type {
  MealPlan,
  MealPlanDraft,
  MealPlanPreferences,
  MealPlanStyle,
} from '../../../core/models/meal-plan.model';

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
    LucideArrowLeft,
    LucideCheck,
    LucidePlus,
    LucideSparkles,
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
  protected readonly generating = signal(false);
  protected readonly saving = signal(false);
  protected readonly regeneratingMeal = signal<number | null>(null);
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
    };
    this.generating.set(true);
    this.plansService
      .preview(preferences)
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
      .save({ ...draft, titulo })
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
    const meal = current?.meals[position];
    if (!current || !meal || this.regeneratingMeal() !== null) return;
    this.regeneratingMeal.set(position);
    this.plansService
      .regenerateMeal(
        current.preferences,
        position,
        meal.items.map((item) => item.food_id),
      )
      .pipe(finalize(() => this.regeneratingMeal.set(null)))
      .subscribe({
        next: (replacement) => {
          const replacementMeal = replacement.meals[position];
          if (!replacementMeal) return;
          const meals = current.meals.map((item, index) =>
            index === position ? replacementMeal : item,
          );
          const totals = meals.reduce(
            (sum, item) => ({
              caloria: sum.caloria + item.totals.caloria,
              proteina: sum.proteina + item.totals.proteina,
              carbo: sum.carbo + item.totals.carbo,
              gordura: sum.gordura + item.totals.gordura,
              quantidade: 0,
            }),
            { caloria: 0, proteina: 0, carbo: 0, gordura: 0, quantidade: 0 },
          );
          this.draft.set({ ...current, meals, totals });
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
    forkJoin({ metas: this.metaService.list(), plans: this.plansService.list() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ metas, plans }) => {
          this.meta.set(metas.find((item) => item.data === null) ?? metas[0] ?? null);
          this.plans.set(plans.filter((plan) => !plan.archived_at));
        },
        error: () => this.toastr.error('Não foi possível carregar seus planos agora.'),
      });
  }
}
