import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideHeart } from '@lucide/angular';

import type { Alimento } from '../../../core/models/alimento.model';
import { calcularPercentuaisMacro } from '../../utils/macro-percent.util';

@Component({
  selector: 'vtp-food-tile',
  standalone: true,
  imports: [DecimalPipe, LucideHeart],
  templateUrl: './food-tile.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodTileComponent {
  readonly food = input.required<Alimento>();

  readonly favoriteClick = output<Alimento>();
  readonly tileClick = output<Alimento>();

  protected readonly percentuais = computed(() => calcularPercentuaisMacro(this.food()));
  protected readonly ringGradient = computed(() => {
    const { proteina, carbo } = this.percentuais();
    const fimProteina = proteina;
    const fimCarbo = proteina + carbo;
    return `conic-gradient(var(--bd-primary) 0 ${fimProteina}%, var(--bd-accent) 0 ${fimCarbo}%, var(--fat) 0 100%)`;
  });

  protected onFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteClick.emit(this.food());
  }
}
