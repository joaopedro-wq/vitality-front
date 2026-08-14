import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideDynamicIcon, type LucideIcon } from '@lucide/angular';

export interface ViewModeOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

@Component({
  selector: 'vtp-view-mode-toggle',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './view-mode-toggle.component.html',
  host: { class: 'inline-flex', role: 'group' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewModeToggleComponent {
  readonly options = input.required<ViewModeOption[]>();
  readonly value = input.required<string>();

  readonly valueChange = output<string>();
}
