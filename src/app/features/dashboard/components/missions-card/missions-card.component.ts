import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { AchievementBadgeComponent } from '../../../../components/molecules/achievement-badge/achievement-badge.component';
import type { DashboardProgressao } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-missions-card',
  standalone: true,
  imports: [AchievementBadgeComponent, TranslocoPipe],
  templateUrl: './missions-card.component.html',
  host: { class: 'card animate-reveal flex flex-col gap-5 p-5' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissionsCardComponent {
  readonly progressao = input.required<DashboardProgressao>();
}
