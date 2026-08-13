import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowRight } from '@lucide/angular';

import type { SugestaoRecomendacao } from '../../../../../components/utils/recomendacao-calc.util';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';


@Component({
  selector: 'vtp-sugestao-step',
  standalone: true,
  imports: [StepFooterComponent, LucideArrowRight],
  templateUrl: './sugestao-step.component.html',
  styleUrl: '../../metas-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugestaoStepComponent {
  readonly sugestao = input.required<SugestaoRecomendacao>();

  readonly voltar = output<void>();
  readonly continuar = output<void>();
}
