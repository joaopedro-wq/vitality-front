import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { SugestaoRecomendacao } from '../../../../../components/utils/recomendacao-calc.util';
import { MetaRevealComponent } from '../../../../../components/molecules/meta-reveal/meta-reveal.component';
import { StepFooterComponent } from '../../../../../components/molecules/step-footer/step-footer.component';

@Component({
  selector: 'vtp-sugestao-step',
  standalone: true,
  imports: [StepFooterComponent, MetaRevealComponent],
  templateUrl: './sugestao-step.component.html',
  host: { class: 'card flex flex-col gap-5 p-6 md:p-8 animate-reveal' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugestaoStepComponent {
  readonly sugestao = input.required<SugestaoRecomendacao>();

  readonly voltar = output<void>();
  readonly continuar = output<void>();
}
