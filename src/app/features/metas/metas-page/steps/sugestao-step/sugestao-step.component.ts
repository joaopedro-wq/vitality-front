import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { SugestaoRecomendacao } from '../../../../../shared/utils/recomendacao-calc.util';
import { StepFooterComponent } from '../step-footer/step-footer.component';


@Component({
  selector: 'vtp-sugestao-step',
  standalone: true,
  imports: [StepFooterComponent],
  templateUrl: './sugestao-step.component.html',
  styleUrl: '../../metas-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugestaoStepComponent {
  readonly sugestao = input.required<SugestaoRecomendacao>();

  readonly voltar = output<void>();
  readonly continuar = output<void>();
}
