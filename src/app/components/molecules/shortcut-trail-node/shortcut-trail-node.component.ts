import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIcon } from '@lucide/angular';

import { ProgressRingIconComponent } from '../../atoms/progress-ring-icon/progress-ring-icon.component';

@Component({
  selector: 'vtp-shortcut-trail-node',
  standalone: true,
  imports: [ProgressRingIconComponent, LucideDynamicIcon],
  templateUrl: './shortcut-trail-node.component.html',
  host: { class: 'flex flex-col items-center gap-1.5 text-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutTrailNodeComponent {
  readonly icone = input.required<LucideIcon>();
  readonly label = input.required<string>();
  readonly status = input.required<string>();
  readonly progresso = input<number | null>(null);
  readonly corVar = input<string>('--bd-primary');
  readonly ativo = input(false, { transform: booleanAttribute });
}
