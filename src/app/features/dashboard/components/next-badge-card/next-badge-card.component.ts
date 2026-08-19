import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { DashboardBadge } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-next-badge-card',
  standalone: true,
  templateUrl: './next-badge-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextBadgeCardComponent {
  readonly badges = input<DashboardBadge[]>([]);

  protected readonly proxima = computed(() => {
    const pendentes = this.badges().filter((b) => !b.conquistado);
    return pendentes.sort((a, b) => b.progresso - a.progresso)[0] ?? null;
  });
}
