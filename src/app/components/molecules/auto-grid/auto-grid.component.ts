import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'vtp-auto-grid',
  standalone: true,
  templateUrl: './auto-grid.component.html',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoGridComponent {
  readonly minItemWidth = input('200px');
  readonly gap = input('0.85rem');
  readonly align = input<'start' | 'center' | 'end' | 'stretch'>('stretch');

  protected readonly templateColumns = computed(
    () => `repeat(auto-fill, minmax(min(${this.minItemWidth()}, 100%), 1fr))`,
  );
}
