import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

export interface MetaRevealValores {
  tmb?: number;
  get?: number;
  caloria: number;
  proteina: number;
  carbo: number;
  gordura: number;
}

/**
 * Anel + dígitos + barras de macro no visual de "build" do quiz de Metas —
 * presentation-only, sem nada de feature. Dois modos:
 * - `animar` true: nasce em estado "calculando" (dígitos e macros esmaecidos,
 *   badge neutro) e revela sozinho depois de um instante — é o momento de
 *   payoff do passo Sugestão.
 * - `animar` false (padrão): já nasce revelado — uso em telas de resultado
 *   (o painel "configurado" de Metas).
 * Respeita `prefers-reduced-motion`: pula direto pro estado revelado.
 *
 * @example
 * ```html
 * <vtp-meta-reveal [valores]="sugestao()" animar tamanho="md" />
 * <vtp-meta-reveal [valores]="metaAtual()" tamanho="lg" />
 * ```
 */
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

  protected readonly macroPercentuais = computed(() => {
    const v = this.valores();
    const totalCal = v.caloria || 1;
    return {
      proteina: Math.min(100, Math.round(((v.proteina * 4) / totalCal) * 100)),
      carbo: Math.min(100, Math.round(((v.carbo * 4) / totalCal) * 100)),
      gordura: Math.min(100, Math.round(((v.gordura * 9) / totalCal) * 100)),
    };
  });

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
