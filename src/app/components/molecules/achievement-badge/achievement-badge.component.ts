import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'vtp-achievement-badge',
  standalone: true,
  templateUrl: './achievement-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementBadgeComponent {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly conquistado = input(false, { transform: booleanAttribute });
}
