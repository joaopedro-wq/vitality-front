import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LucideHeart } from '@lucide/angular';

import type { Alimento } from '../../../core/models/alimento.model';
import { FoodIllustrationComponent } from '../../atoms/food-illustration/food-illustration.component';

@Component({
  selector: 'vtp-food-tile',
  standalone: true,
  imports: [DecimalPipe, FoodIllustrationComponent, LucideHeart],
  templateUrl: './food-tile.component.html',
  styleUrl: './food-tile.component.scss',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodTileComponent {
  readonly food = input.required<Alimento>();

  readonly favoriteClick = output<Alimento>();
  readonly tileClick = output<Alimento>();
  protected readonly imageErrored = signal(false);

  protected onFavorite(event: Event): void {
    event.stopPropagation();
    this.favoriteClick.emit(this.food());
  }

  protected onImageError(): void {
    this.imageErrored.set(true);
  }
}
