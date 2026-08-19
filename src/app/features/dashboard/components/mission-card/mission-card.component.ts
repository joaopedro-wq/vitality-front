import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucidePlus } from '@lucide/angular';

import type { DashboardProximaRefeicao } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-mission-card',
  standalone: true,
  imports: [RouterLink, BdButtonComponent, TranslocoPipe, LucidePlus],
  templateUrl: './mission-card.component.html',
  host: {
    class:
      'card animate-reveal relative flex flex-col items-center gap-4 overflow-hidden p-6 text-center',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionCardComponent {
  readonly proximaRefeicao = input<DashboardProximaRefeicao | null>(null);

  protected readonly diaCompleto = computed(() => this.proximaRefeicao() === null);
}
