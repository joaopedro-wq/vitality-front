import { A11yModule } from '@angular/cdk/a11y';
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideTrophy, LucideX } from '@lucide/angular';

import { NutritionRevealComponent } from '../../molecules/nutrition-reveal/nutrition-reveal.component';
import type { DiaryMacros } from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';

@Component({
  selector: 'vtp-day-reveal-overlay',
  standalone: true,
  imports: [A11yModule, DecimalPipe, NutritionRevealComponent, LucideTrophy, LucideX],
  templateUrl: './day-reveal-overlay.component.html',
  styles: [':host { display: contents; }'],
  host: { '(document:keydown.escape)': 'fechar.emit()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayRevealOverlayComponent {
  readonly totals = input.required<DiaryMacros>();
  readonly meta = input<MetaDiaria | null>(null);
  readonly titulo = input('Seu dia');
  readonly label = input('Como está seu dia');
  readonly completo = input(false);

  readonly fechar = output<void>();

  protected readonly progresso = computed(() => {
    const alvo = this.meta()?.meta_calorias;
    if (!alvo || alvo <= 0) return null;
    return Math.round((this.totals().caloria / alvo) * 100);
  });
}
