import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { FoodPreferencePickerComponent } from '../../../../../components/molecules/food-preference-picker/food-preference-picker.component';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import type { Alimento } from '../../../../../core/models/alimento.model';
import type {
  FoodRestrictionOption,
  MealPlanDietType,
  MealPlanFeasibility,
} from '../../../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-preferencias-step',
  standalone: true,
  imports: [StepFooterComponent, FoodPreferencePickerComponent, TranslocoPipe],
  templateUrl: './preferencias-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenciasStepComponent implements OnInit {
  protected readonly dietTypes: MealPlanDietType[] = ['onivora', 'vegetariana'];
  readonly excluidosIniciais = input.required<Alimento[]>();
  readonly incluidosIniciais = input.required<Alimento[]>();
  readonly mealCount = input.required<3 | 4 | 5>();
  readonly dietTypeInicial = input.required<MealPlanDietType>();
  readonly restrictionOptions = input<FoodRestrictionOption[]>([]);
  readonly dietOptions = input<Partial<Record<MealPlanDietType, MealPlanFeasibility>>>({});
  readonly feasibility = input<MealPlanFeasibility | null>(null);
  readonly checkingFeasibility = input(false);
  readonly voltar = output<void>();
  readonly concluido = output<{ evitados: Alimento[]; incluidos: Alimento[]; dietType: MealPlanDietType; restrictions: string[] }>();
  readonly criteriaChange = output<{ dietType: MealPlanDietType; restrictions: string[] }>();

  protected readonly evitados = signal<Alimento[]>([]);
  protected readonly incluidos = signal<Alimento[]>([]);
  protected readonly dietType = signal<MealPlanDietType>('onivora');
  protected readonly restrictions = signal<string[]>([]);
  protected readonly selectableRestrictions = computed(() =>
    // Mantém visíveis as opções incompatíveis para explicar a limitação pelo
    // próprio estado desabilitado, em vez de fazê-las parecer que não existem.
    this.restrictionOptions().filter((item) => item.type !== 'diet'),
  );

  protected readonly evitadosIds = computed(() => this.evitados().map((food) => food.id));
  protected readonly incluidosIds = computed(() => this.incluidos().map((food) => food.id));

  ngOnInit(): void {
    this.evitados.set(this.excluidosIniciais());
    this.incluidos.set(this.incluidosIniciais());
    this.dietType.set(this.dietTypeInicial());
    // Uma nova geração sempre começa sem restrições pré-marcadas. O usuário
    // escolhe conscientemente as opções aplicáveis à combinação atual.
    this.restrictions.set([]);
  }

  protected avancar(): void {
    if (this.feasibility() && !this.feasibility()!.feasible) return;
    this.concluido.emit({ evitados: this.evitados(), incluidos: this.incluidos(), dietType: this.dietType(), restrictions: this.restrictions() });
  }

  protected setDietType(type: MealPlanDietType): void {
    if (this.checkingFeasibility() || this.dietUnavailable(type)) return;
    this.dietType.set(type);
    this.emitCriteria();
  }

  protected dietUnavailable(type: MealPlanDietType): boolean {
    return this.dietOptions()[type]?.feasible === false;
  }

  protected toggleRestriction(slug: string): void {
    if (this.checkingFeasibility()) return;
    this.restrictions.update((items) =>
      items.includes(slug) ? items.filter((item) => item !== slug) : [...items, slug],
    );
    this.emitCriteria();
  }

  private emitCriteria(): void {
    this.criteriaChange.emit({ dietType: this.dietType(), restrictions: this.restrictions() });
  }
}
