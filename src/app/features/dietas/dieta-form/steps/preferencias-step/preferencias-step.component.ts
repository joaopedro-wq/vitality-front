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

type CategoriaProteina = 'carne_vermelha' | 'aves' | 'fruto_do_mar';

const SLUG_POR_CATEGORIA: Record<CategoriaProteina, string> = {
  carne_vermelha: 'sem_carne_vermelha',
  aves: 'sem_aves',
  fruto_do_mar: 'sem_frutos_do_mar',
};

const CATEGORIA_POR_SLUG: Record<string, CategoriaProteina> = {
  sem_carne_vermelha: 'carne_vermelha',
  sem_aves: 'aves',
  sem_frutos_do_mar: 'fruto_do_mar',
};
const LABEL_KEY_POR_CATEGORIA: Record<CategoriaProteina, string> = {
  carne_vermelha: 'dietPlan.steps.preferences.proteinCategories.carneVermelha',
  aves: 'dietPlan.steps.preferences.proteinCategories.aves',
  fruto_do_mar: 'dietPlan.steps.preferences.proteinCategories.frutosDoMar',
};

@Component({
  selector: 'vtp-preferencias-step',
  standalone: true,
  imports: [StepFooterComponent, FoodPreferencePickerComponent, TranslocoPipe],
  templateUrl: './preferencias-step.component.html',
  host: { class: 'card block p-5 sm:p-6 md:p-8 animate-reveal' },
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
  readonly concluido = output<{
    evitados: Alimento[];
    incluidos: Alimento[];
    dietType: MealPlanDietType;
    restrictions: string[];
    proteinPriorityLabelKeys: string[];
  }>();
  readonly criteriaChange = output<{ dietType: MealPlanDietType; restrictions: string[] }>();

  protected readonly evitados = signal<Alimento[]>([]);
  protected readonly incluidos = signal<Alimento[]>([]);
  protected readonly dietType = signal<MealPlanDietType>('onivora');
  protected readonly restrictions = signal<string[]>([]);
  protected readonly selectableRestrictions = computed(() =>
    // Mantém visíveis as opções incompatíveis para explicar a limitação pelo
    // próprio estado desabilitado, em vez de fazê-las parecer que não existem.
    // 'preference' (carne vermelha/aves/frutos do mar) vira uma seção própria
    // logo abaixo — só faz sentido dentro de onívora, ver proteinPreferences.
    this.restrictionOptions().filter((item) => item.type !== 'diet' && item.type !== 'preference'),
  );

  /** As 3 opções de proteína, com o rótulo positivo do chip ("Aves") e a categoria
   *  (`CategoriaProteina`) usada por `toggleProteinPriority`/`prioridadesProteina`. Não herda
   *  `available` da API: aquele campo mede viabilidade de EXCLUIR o slug isolado, que não bate
   *  com a semântica invertida daqui (marcar = priorizar, não excluir) — a inviabilidade da
   *  combinação final continua visível pelo aviso genérico de `feasibility()` no rodapé.
   */
  protected readonly proteinPreferences = computed(() =>
    this.restrictionOptions()
      .filter((item) => item.type === 'preference')
      .flatMap((item) => {
        const categoria = CATEGORIA_POR_SLUG[item.slug];
        return categoria ? [{ categoria, labelKey: LABEL_KEY_POR_CATEGORIA[categoria] }] : [];
      }),
  );

  protected readonly prioridadesProteina = signal<CategoriaProteina[]>([]);

  /** O backend só entende exclusão (`restriction_slugs`). "Priorizar aves" vira, na prática,
   *  excluir toda categoria de proteína que a pessoa NÃO marcou — determinístico, sem depender
   *  do prompt. Sem nenhuma categoria marcada, não exclui nada (estado inicial = tudo permitido,
   *  igual era antes dessa tela existir). */
  private readonly exclusoesDeProteina = computed<string[]>(() => {
    const prioridades = this.prioridadesProteina();
    if (this.dietType() !== 'onivora' || prioridades.length === 0) return [];

    return (Object.keys(SLUG_POR_CATEGORIA) as CategoriaProteina[])
      .filter((categoria) => !prioridades.includes(categoria))
      .map((categoria) => SLUG_POR_CATEGORIA[categoria]);
  });

  protected readonly restricoesEfetivas = computed(() => [
    ...this.restrictions(),
    ...this.exclusoesDeProteina(),
  ]);

  protected readonly evitadosIds = computed(() => this.evitados().map((food) => food.id));
  protected readonly incluidosIds = computed(() => this.incluidos().map((food) => food.id));

  ngOnInit(): void {
    this.evitados.set(this.excluidosIniciais());
    this.incluidos.set(this.incluidosIniciais());
    this.dietType.set(this.dietTypeInicial());
    // Uma nova geração sempre começa sem restrições/prioridades pré-marcadas. O usuário
    // escolhe conscientemente as opções aplicáveis à combinação atual.
    this.restrictions.set([]);
    this.prioridadesProteina.set([]);
  }

  protected avancar(): void {
    if (this.feasibility() && !this.feasibility()!.feasible) return;
    this.concluido.emit({
      evitados: this.evitados(),
      incluidos: this.incluidos(),
      dietType: this.dietType(),
      restrictions: this.restricoesEfetivas(),
      proteinPriorityLabelKeys: this.prioridadesProteina().map(
        (categoria) => LABEL_KEY_POR_CATEGORIA[categoria],
      ),
    });
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

  protected toggleProteinPriority(categoria: CategoriaProteina): void {
    if (this.checkingFeasibility()) return;
    this.prioridadesProteina.update((items) =>
      items.includes(categoria)
        ? items.filter((item) => item !== categoria)
        : [...items, categoria],
    );
    this.emitCriteria();
  }

  private emitCriteria(): void {
    this.criteriaChange.emit({
      dietType: this.dietType(),
      restrictions: this.restricoesEfetivas(),
    });
  }
}
