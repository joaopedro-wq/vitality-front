import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { BdModalComponent } from 'bandeira-ui';
import { LucideTrophy } from '@lucide/angular';

import { NutritionRevealComponent } from '../../molecules/nutrition-reveal/nutrition-reveal.component';
import type { DiaryMacros } from '../../../core/models/diary.model';
import type { MetaDiaria } from '../../../core/models/meta-diaria.model';

@Component({
  selector: 'vtp-day-reveal-overlay',
  standalone: true,
  imports: [DecimalPipe, BdModalComponent, NutritionRevealComponent, LucideTrophy],
  templateUrl: './day-reveal-overlay.component.html',
  styles: [':host { display: contents; }'],
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

  /** `bd-modal` já fecha sozinho no Esc/clique no fundo/X — isso só repassa
   * pro pai, que decide destruir o componente (`@if (revelacaoAberta())`). */
  protected onOpenChange(open: boolean): void {
    if (!open) this.fechar.emit();
  }
}
