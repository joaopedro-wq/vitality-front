import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

export interface StepTrackItem {
  titulo: string;
  descricao?: string;
}

export type StepTrackOrientation = 'vertical' | 'horizontal';

@Component({
  selector: 'vtp-step-track',
  standalone: true,
  imports: [LucideCheck],
  templateUrl: './step-track.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepTrackComponent {
  readonly steps = input.required<StepTrackItem[]>();
  readonly ativo = input.required<number>();
  readonly label = input('Etapas');
  readonly orientacao = input<StepTrackOrientation>('vertical');

  readonly stepClick = output<number>();
}
