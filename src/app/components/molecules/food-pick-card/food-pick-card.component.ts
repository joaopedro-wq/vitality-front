import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideCheck } from '@lucide/angular';

import { FoodIllustrationComponent } from '../../atoms/food-illustration/food-illustration.component';
import type { Alimento } from '../../../core/models/alimento.model';
import { calcularProporcaoMacro } from '../../utils/macro-percent.util';

/**
 * Card denso de escolha rápida de alimento — a grade que aparece enquanto se
 * monta um prato.
 *
 * Não é o `FoodTileComponent`: aquele é o card da biblioteca de Alimentos, com
 * favoritar e imagem grande. Aqui o que importa é caber muitos na tela e mostrar
 * a composição do alimento numa tacada (a barra de três faixas), sem nenhuma ação
 * concorrendo com "escolher".
 */
@Component({
  selector: 'vtp-food-pick-card',
  standalone: true,
  imports: [DecimalPipe, FoodIllustrationComponent, LucideCheck],
  templateUrl: './food-pick-card.component.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodPickCardComponent {
  readonly food = input.required<Alimento>();
  readonly selecionado = input(false);

  readonly pick = output<Alimento>();

  protected readonly proporcao = computed(() => calcularProporcaoMacro(this.food()));
}
