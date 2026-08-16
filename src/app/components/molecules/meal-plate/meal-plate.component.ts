import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideDynamicIcon, type LucideIcon } from '@lucide/angular';

import { PlateLoaderComponent } from '../../atoms/plate-loader/plate-loader.component';
import type { MealPlanMeal } from '../../../core/models/meal-plan.model';

/**
 * Um prato circular tocável — a unidade visual da "Mesa de Montagem" (Dietas).
 * Presentation-only: recebe a refeição pronta e só emite `select`; quem decide
 * qual prato está aberto (e o que preencher na gaveta abaixo) é a tela.
 */
@Component({
  selector: 'vtp-meal-plate',
  standalone: true,
  imports: [DecimalPipe, LucideDynamicIcon, PlateLoaderComponent],
  templateUrl: './meal-plate.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlateComponent {
  readonly meal = input.required<MealPlanMeal>();
  readonly ativo = input(false);
  readonly regenerando = input(false);
  readonly icone = input.required<LucideIcon>();
  readonly orientacao = input<'circular' | 'linha'>('circular');

  readonly select = output<void>();

  protected readonly progresso = computed(() => {
    const { totals, target } = this.meal();
    if (!target.caloria) return 0;
    return Math.min(100, Math.round((totals.caloria / target.caloria) * 100));
  });

  protected readonly aro = computed(
    () => `conic-gradient(var(--bd-primary) ${this.progresso()}%, var(--bd-border) 0)`,
  );
}
