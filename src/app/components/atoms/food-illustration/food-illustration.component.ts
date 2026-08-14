import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'vtp-food-illustration',
  standalone: true,
  templateUrl: './food-illustration.component.html',
  styleUrl: './food-illustration.component.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodIllustrationComponent {
  readonly illustrationKey = input<string | null>(null);

  protected readonly visualClass = computed(() => {
    const key = this.illustrationKey() ?? 'meal';
    const aliases: Record<string, string> = {
      cheese: 'milk',
    };
    return `illustration illustration--${aliases[key] ?? key}`;
  });
}
