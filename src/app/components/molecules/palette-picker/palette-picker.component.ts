import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

import { type PaletteId, type PaletteOption } from '../../../core/layout/palette.service';

@Component({
  selector: 'vtp-palette-picker',
  standalone: true,
  imports: [LucideCheck],
  templateUrl: './palette-picker.component.html',
  styleUrl: './palette-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PalettePickerComponent {
  readonly paletas = input.required<readonly PaletteOption[]>();
  readonly ativa = input.required<PaletteId>();

  readonly escolher = output<PaletteId>();
}
