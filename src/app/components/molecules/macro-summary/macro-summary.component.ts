import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface MacroValores {
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}


@Component({
  selector: 'vtp-macro-summary',
  standalone: true,
  templateUrl: './macro-summary.component.html',
  styleUrl: './macro-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroSummaryComponent {
  readonly valores = input<MacroValores | null>(null);
  readonly tamanho = input<'sm' | 'lg' | 'xl'>('sm');
  readonly progresso = input(0.7);
  readonly orientacao = input<'row' | 'col'>('row');

  protected readonly raio = computed(() => ({ sm: 25, lg: 48, xl: 64 })[this.tamanho()]);
  protected readonly espessura = computed(() => ({ sm: 8, lg: 11, xl: 14 })[this.tamanho()]);
  protected readonly viewBox = computed(() => {
    const r = this.raio();
    const e = this.espessura();
    const size = r * 2 + e;
    return `0 0 ${size} ${size}`;
  });
  protected readonly centro = computed(() => this.raio() + this.espessura() / 2);
  protected readonly circunferencia = computed(() => 2 * Math.PI * this.raio());
  protected readonly dashoffset = computed(() => this.circunferencia() * (1 - this.progresso()));
}
