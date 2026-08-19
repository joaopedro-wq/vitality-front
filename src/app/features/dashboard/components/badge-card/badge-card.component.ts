import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import {
  MacroSummaryComponent,
  type MacroValores,
} from '../../../../components/molecules/macro-summary/macro-summary.component';
import type { DashboardHoje, DashboardProgressao } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-badge-card',
  standalone: true,
  imports: [MacroSummaryComponent, TranslocoPipe],
  templateUrl: './badge-card.component.html',
  host: { class: 'card animate-reveal flex flex-col items-center gap-3 p-6 text-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeCardComponent {
  readonly hoje = input.required<DashboardHoje>();
  readonly progressao = input.required<DashboardProgressao>();

  protected readonly valoresMacro = computed<MacroValores>(() => {
    const consumido = this.hoje().consumido;
    return {
      caloria: Math.round(consumido.caloria),
      proteina: Math.round(consumido.proteina),
      carbo: Math.round(consumido.carbo),
      gordura: Math.round(consumido.gordura),
    };
  });

  protected readonly progressoFracao = computed(() => Math.min(this.hoje().percentual / 100, 1));
}
