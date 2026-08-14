import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { MacroSummaryComponent, type MacroValores } from '../macro-summary/macro-summary.component';
import type { DiaryMacros } from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';

@Component({
  selector: 'vtp-diary-day-summary',
  standalone: true,
  imports: [DecimalPipe, MacroSummaryComponent],
  templateUrl: './diary-day-summary.component.html',
  styleUrl: './diary-day-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiaryDaySummaryComponent {
  readonly totals = input.required<DiaryMacros>();
  readonly meta = input<MetaDiaria | null>(null);

  protected readonly values = computed<MacroValores>(() => ({
    caloria: this.totals().caloria,
    proteina: this.totals().proteina,
    carbo: this.totals().carbo,
    gordura: this.totals().gordura,
  }));
  protected readonly progress = computed(() => {
    const target = this.meta()?.meta_calorias;
    return target ? Math.min(this.totals().caloria / target, 1) : 0;
  });
}
