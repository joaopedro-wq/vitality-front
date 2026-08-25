import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import { LanguageService } from '../../../../../core/i18n/language.service';
import type { Alimento } from '../../../../../core/models/alimento.model';
import type {
  FoodRestrictionOption,
  MealPlanDietType,
  MealPlanStyle,
} from '../../../../../core/models/meal-plan.model';

@Component({
  selector: 'vtp-revisar-step',
  standalone: true,
  imports: [StepFooterComponent, TranslocoPipe],
  templateUrl: './revisar-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevisarStepComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly language = inject(LanguageService);

  readonly mealCount = input.required<3 | 4 | 5>();
  readonly style = input.required<MealPlanStyle>();
  readonly dietType = input.required<MealPlanDietType>();
  readonly restrictions = input.required<FoodRestrictionOption[]>();
  readonly excluded = input.required<Alimento[]>();
  readonly included = input.required<Alimento[]>();
  readonly gerando = input(false);

  readonly voltar = output<void>();
  readonly gerar = output<void>();

  protected formatStyle(style: MealPlanStyle): string {
    this.language.locale();

    return this.transloco.translate(`dietPlan.styleLabels.${style}`);
  }

  protected formatDiet(dietType: MealPlanDietType): string {
    this.language.locale();

    return this.transloco.translate(`dietPlan.steps.preferences.dietTypes.${dietType}`);
  }

  protected formatRestrictions(restrictions: FoodRestrictionOption[]): string {
    return restrictions.length
      ? restrictions.map((restriction) => restriction.label).join(', ')
      : this.transloco.translate('dietPlan.nothing');
  }
}
