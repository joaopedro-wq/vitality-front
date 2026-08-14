import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'vtp-range-slider',
  standalone: true,
  templateUrl: './range-slider.component.html',
  styleUrl: './range-slider.component.scss',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeSliderComponent {
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input(1);
  readonly value = input.required<[number, number]>();
  readonly label = input('');
  readonly formatValue = input<(v: number) => string>((v) => String(v));

  readonly valueChange = output<[number, number]>();

  protected readonly pctMin = computed(() => this.percentual(this.value()[0]));
  protected readonly pctMax = computed(() => this.percentual(this.value()[1]));

  protected onMinInput(event: Event): void {
    const novo = Number((event.target as HTMLInputElement).value);
    const [, atualMax] = this.value();
    this.valueChange.emit([Math.min(novo, atualMax), atualMax]);
  }

  protected onMaxInput(event: Event): void {
    const novo = Number((event.target as HTMLInputElement).value);
    const [atualMin] = this.value();
    this.valueChange.emit([atualMin, Math.max(novo, atualMin)]);
  }

  private percentual(v: number): number {
    const faixa = this.max() - this.min() || 1;
    return ((v - this.min()) / faixa) * 100;
  }
}
