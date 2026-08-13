import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

export interface StepTrackItem {
  titulo: string;
  descricao?: string;
}



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

  readonly stepClick = output<number>();
}
