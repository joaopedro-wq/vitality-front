import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { DiaryMacros, DiaryNutrient } from '../../../core/models/diary.model';
import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';
import { MetaRevealComponent, type MetaRevealValores } from '../meta-reveal/meta-reveal.component';

@Component({
  selector: 'vtp-nutrition-reveal',
  standalone: true,
  imports: [DecimalPipe, MetaRevealComponent, PlateLoaderComponent],
  templateUrl: './nutrition-reveal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionRevealComponent {
  readonly totals = input.required<DiaryMacros>();
  readonly nutrients = input<readonly DiaryNutrient[]>([]);
  readonly animar = input(false);
  readonly tamanho = input<'md' | 'lg'>('md');
  readonly label = input('Resumo nutricional');
  readonly labelCalculando = input('Calculando…');
  readonly calorieLabel = input('kcal / dia');
  readonly carregandoNutrientes = input(false);
  readonly mostrarNutrientes = input(false);

  protected readonly valores = computed<MetaRevealValores>(() => {
    const totals = this.totals();
    return {
      caloria: Math.round(totals.caloria),
      proteina: Math.round(totals.proteina),
      carbo: Math.round(totals.carbo),
      gordura: Math.round(totals.gordura),
    };
  });
}
