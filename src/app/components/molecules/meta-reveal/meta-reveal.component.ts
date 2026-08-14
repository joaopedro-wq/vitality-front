import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

import { calcularPercentuaisMacro } from '../../utils/macro-percent.util';

export interface MetaRevealValores {
  tmb?: number;
  get?: number;
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

@Component({
  selector: 'vtp-meta-reveal',
  standalone: true,
  templateUrl: './meta-reveal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaRevealComponent {
  readonly valores = input.required<MetaRevealValores>();
  readonly animar = input(false);
  readonly tamanho = input<'md' | 'lg'>('md');
  /** Texto do badge quando já revelado — muda o tom conforme o contexto
   * (recém-calculado vs. meta já salva de antes). */
  readonly label = input('Build desbloqueado');

  protected readonly revelado = signal(false);

  protected readonly digitos = computed(() => String(this.valores().caloria).split(''));

  protected readonly macroPercentuais = computed(() => calcularPercentuaisMacro(this.valores()));

  constructor() {
    effect((onCleanup) => {
      const precisaAnimar = this.animar();
      const reduzMovimento =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!precisaAnimar || reduzMovimento) {
        this.revelado.set(true);
        return;
      }

      this.revelado.set(false);
      const id = setTimeout(() => this.revelado.set(true), 900);
      onCleanup(() => clearTimeout(id));
    });
  }
}
