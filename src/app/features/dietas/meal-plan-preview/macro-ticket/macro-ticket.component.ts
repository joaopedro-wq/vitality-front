import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export interface MacroTicketValores {
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/**
 * "Ticket" de macro (canhoto com kcal, talão com P/C/G) — extraído do preview
 * de plano alimentar (`dieta-form`). Presentation-only, reaproveitado também
 * pelo fluxo manual (`ManualDietaFormComponent`).
 */
@Component({
  selector: 'vtp-macro-ticket',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './macro-ticket.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroTicketComponent {
  readonly valores = input.required<MacroTicketValores | null>();
}
