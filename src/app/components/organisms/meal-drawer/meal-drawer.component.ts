import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowLeft } from '@lucide/angular';
import { BdButtonComponent, BdTooltipDirective } from 'bandeira-ui';
import { TranslocoPipe } from '@jsverse/transloco';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';
import { MealMacroSummaryComponent } from '../../molecules/meal-macro-summary/meal-macro-summary.component';
import type {
  MealPlanItem,
  MealPlanItemSuggestion,
  MealPlanMeal,
} from '../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-meal-drawer',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslocoPipe,
    BdButtonComponent,
    BdTooltipDirective,
    LucideArrowLeft,
    PlateLoaderComponent,
    MealMacroSummaryComponent,
  ],
  templateUrl: './meal-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealDrawerComponent {
  readonly meal = input.required<MealPlanMeal>();
  readonly suggestions = input<MealPlanItemSuggestion[]>([]);
  readonly swapFailureMessage = input<string | null>(null);
  readonly swapTarget = input<MealPlanItem | null>(null);
  readonly suggesting = input(false);
  readonly applyingChange = input(false);
  readonly regenerando = input(false);
  /** `false` esconde ações que dependem de sugestão por IA (trocar item,
   * reorganizar refeição) — usado pelo fluxo manual de dietas. Ações que não
   * dependem de IA (ex.: "Usar no diário") continuam visíveis. */
  readonly acoesIa = input(true);

  readonly swapItem = output<MealPlanItem>();
  readonly closeSwap = output<void>();
  readonly loadSuggestions = output<void>();
  readonly applySuggestion = output<MealPlanItemSuggestion>();
  readonly regenerateMeal = output<void>();
  readonly useMeal = output<void>();
}
