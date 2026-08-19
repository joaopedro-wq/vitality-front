import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BdButtonComponent } from 'bandeira-ui';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucidePlus, LucideUtensils } from '@lucide/angular';

import { ProgressRingIconComponent } from '../../../../components/atoms/progress-ring-icon/progress-ring-icon.component';
import type { DashboardProximaRefeicao } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-mission-card',
  standalone: true,
  imports: [
    RouterLink,
    BdButtonComponent,
    TranslocoPipe,
    LucidePlus,
    LucideUtensils,
    ProgressRingIconComponent,
  ],
  templateUrl: './mission-card.component.html',
  host: {
    class: 'card animate-reveal relative @container overflow-hidden p-6',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionCardComponent {
  readonly proximaRefeicao = input<DashboardProximaRefeicao | null>(null);

  protected readonly diaCompleto = computed(() => this.proximaRefeicao() === null);
}
