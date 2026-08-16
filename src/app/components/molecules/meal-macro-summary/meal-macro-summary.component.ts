import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { DiaryMacros } from '../../../core/models/diary.model';

@Component({
  selector: 'vtp-meal-macro-summary',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './meal-macro-summary.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealMacroSummaryComponent {
  readonly totals = input.required<DiaryMacros>();
}
