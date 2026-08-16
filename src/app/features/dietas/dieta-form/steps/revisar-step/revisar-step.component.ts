import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';
import type { Alimento } from '../../../../../core/models/alimento.model';
import type { MealPlanStyle } from '../../../../../core/models/meal-plan.model';

const ROTULOS_ESTILO: Record<MealPlanStyle, string> = {
  rapido: 'Rápido',
  caseiro: 'Caseiro',
  economico: 'Econômico',
};

@Component({
  selector: 'vtp-revisar-step',
  standalone: true,
  imports: [StepFooterComponent],
  templateUrl: './revisar-step.component.html',
  host: { class: 'card flex flex-col gap-1.5 p-6 md:p-8 text-center animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevisarStepComponent {
  readonly mealCount = input.required<3 | 4 | 5>();
  readonly style = input.required<MealPlanStyle>();
  readonly excluded = input.required<Alimento[]>();
  readonly gerando = input(false);

  readonly voltar = output<void>();
  readonly gerar = output<void>();

  protected formatStyle(style: MealPlanStyle): string {
    return ROTULOS_ESTILO[style];
  }
}
