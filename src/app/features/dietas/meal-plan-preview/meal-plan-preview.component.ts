import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  LucideApple,
  LucideArrowLeft,
  LucideArrowRight,
  LucideCoffee,
  LucideInfo,
  LucideMoon,
  LucideMoonStar,
  LucideSave,
  LucideSun,
  LucideSunrise,
  LucideSunset,
  LucideUtensils,
  LucideUtensilsCrossed,
  type LucideIcon,
} from '@lucide/angular';
import { TranslocoPipe } from '@jsverse/transloco';
import { BdButtonComponent } from 'bandeira-ui';

import { PlateLoaderComponent } from '../../../components/atoms/plate-loader/plate-loader.component';
import { MealPlateComponent } from '../../../components/molecules/meal-plate/meal-plate.component';
import { MealDrawerComponent } from '../../../components/organisms/meal-drawer/meal-drawer.component';
import type {
  MealPlanDraft,
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
} from '../../../core/models/meal-plan.model';
import { MacroTicketComponent, type MacroTicketValores } from './macro-ticket/macro-ticket.component';

/** Ícone de período por horário — fallback quando o nome da refeição não bate com nada conhecido. */
const ICONES_PERIODO: ReadonlyArray<readonly [limite: number, icone: LucideIcon]> = [
  [10, LucideSunrise],
  [15, LucideSun],
  [18, LucideSunset],
  [24, LucideMoon],
];

/** Ícone por tipo de refeição — casa por palavra-chave (pt/en) no nome; sem
 * match, cai no fallback por horário (`ICONES_PERIODO`). */
const ICONES_REFEICAO: ReadonlyArray<readonly [palavras: string[], icone: LucideIcon]> = [
  [['café', 'manhã', 'breakfast'], LucideCoffee],
  [['almoço', 'lunch'], LucideUtensils],
  [['lanche', 'snack'], LucideApple],
  [['jantar', 'dinner'], LucideUtensilsCrossed],
  [['ceia', 'evening'], LucideMoonStar],
];

/**
 * Bloco de prévia de um plano alimentar (título editável, ticket de macro,
 * navegação de refeição, drawer) — extraído de `DietaFormComponent` pra ser
 * reaproveitado também pelo fluxo manual (`ManualDietaFormComponent`). O
 * componente só apresenta e emite eventos; toda chamada de API continua no
 * componente-pai (`DietaFormComponent`/`ManualDietaFormComponent`), que já
 * possui os services de meal plan e o padrão `takeUntil(this.destruido)`.
 */
@Component({
  selector: 'vtp-meal-plan-preview',
  standalone: true,
  imports: [
    BdButtonComponent,
    LucideArrowLeft,
    LucideArrowRight,
    LucideSave,
    LucideInfo,
    PlateLoaderComponent,
    MealPlateComponent,
    MealDrawerComponent,
    MacroTicketComponent,
    TranslocoPipe,
  ],
  templateUrl: './meal-plan-preview.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlanPreviewComponent {
  readonly draft = input.required<MealPlanDraft>();
  readonly editando = input(false);
  readonly saving = input(false);
  readonly dirty = input(false);
  readonly titulo = input('');
  readonly isManual = input(false);

  readonly regeneratingMeal = input<number | null>(null);
  readonly suggesting = input(false);
  readonly applyingChange = input(false);
  readonly suggestions = input<MealPlanItemSuggestion[]>([]);
  readonly swapFailureMessage = input<string | null>(null);
  readonly swapTarget = input<{ meal: MealPlanMeal; item: MealPlanItem } | null>(null);

  readonly tituloChange = output<string>();
  readonly save = output<void>();
  readonly ajustarPreferencias = output<void>();
  readonly regenerateMeal = output<number>();
  readonly openItemSwap = output<{ meal: MealPlanMeal; item: MealPlanItem }>();
  readonly closeSwap = output<void>();
  readonly loadSuggestions = output<void>();
  readonly applySuggestion = output<MealPlanItemSuggestion>();
  readonly useMealFromDrawer = output<MealPlanMeal>();

  protected readonly pratoAberto = signal<number | null>(null);

  protected readonly pratoAtivo = computed(() => {
    const aberto = this.pratoAbertoResolvido();
    if (aberto === null) return null;
    return this.draft().meals.find((meal) => meal.position === aberto) ?? null;
  });

  protected readonly indiceAtivo = computed(() => {
    const meals = this.draft().meals;
    const aberto = this.pratoAbertoResolvido();
    const indice = meals.findIndex((meal) => meal.position === aberto);
    return indice === -1 ? 0 : indice;
  });

  protected readonly macroValores = computed<MacroTicketValores | null>(() => {
    const totals = this.draft()?.totals;
    if (!totals) return null;
    return {
      caloria: Math.round(totals.caloria),
      proteina: Math.round(totals.proteina),
      carbo: Math.round(totals.carbo),
      gordura: Math.round(totals.gordura),
    };
  });

  /** `pratoAberto` só é setado explicitamente ao selecionar um prato; até lá,
   * cai pra primeira refeição do draft — mesmo comportamento de
   * `DietaFormComponent` (que setava `pratoAberto` no `next` do preview). */
  private readonly pratoAbertoResolvido = computed(
    () => this.pratoAberto() ?? this.draft().meals[0]?.position ?? null,
  );

  protected selecionarPrato(position: number): void {
    if (this.pratoAbertoResolvido() === position) return;
    this.pratoAberto.set(position);
    this.closeSwap.emit();
  }

  protected mealAnterior(): void {
    const meals = this.draft().meals;
    const anterior = meals[this.indiceAtivo() - 1];
    if (anterior) this.selecionarPrato(anterior.position);
  }

  protected mealSeguinte(): void {
    const meals = this.draft().meals;
    const seguinte = meals[this.indiceAtivo() + 1];
    if (seguinte) this.selecionarPrato(seguinte.position);
  }

  /** Ícone Lucide da refeição — por tipo (nome) quando reconhecido, senão por horário. */
  protected iconeRefeicao(meal: MealPlanMeal): LucideIcon {
    const nome = meal.descricao.toLowerCase();
    const porTipo = ICONES_REFEICAO.find(([palavras]) =>
      palavras.some((palavra) => nome.includes(palavra)),
    );
    if (porTipo) return porTipo[1];
    const hora = Number(meal.horario.split(':')[0]);
    return ICONES_PERIODO.find(([limite]) => hora < limite)?.[1] ?? LucideMoon;
  }

  protected onTituloChange(valor: string): void {
    this.tituloChange.emit(valor);
  }
}
