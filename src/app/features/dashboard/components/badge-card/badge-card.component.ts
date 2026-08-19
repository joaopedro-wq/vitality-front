import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideFlame } from '@lucide/angular';
import { TranslocoPipe } from '@jsverse/transloco';

import { AchievementBadgeComponent } from '../../../../components/molecules/achievement-badge/achievement-badge.component';
import {
  MacroSummaryComponent,
  type MacroValores,
} from '../../../../components/molecules/macro-summary/macro-summary.component';
import type {
  DashboardBadge,
  DashboardHoje,
  DashboardStreak,
} from '../../../../core/models/dashboard.model';

@Component({
  selector: 'vtp-badge-card',
  standalone: true,
  imports: [MacroSummaryComponent, AchievementBadgeComponent, LucideFlame, TranslocoPipe],
  templateUrl: './badge-card.component.html',
  host: { class: 'card animate-reveal flex flex-col items-center gap-3 p-6 text-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeCardComponent {
  readonly hoje = input.required<DashboardHoje>();
  readonly streak = input.required<DashboardStreak>();
  readonly badges = input<DashboardBadge[]>([]);

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
