import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'vtp-animated-number',
  standalone: true,
  template: '{{ exibido() }}',
  host: { class: 'tabular-nums' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedNumberComponent {
  readonly valor = input.required<number>();
  readonly duracaoMs = input(700);
  readonly atrasoMs = input(0);

  protected readonly exibido = signal(0);

  private atual = 0;

  constructor() {
    effect((onCleanup) => {
      const alvo = this.valor();
      const reduzMovimento =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduzMovimento) {
        this.atual = alvo;
        this.exibido.set(alvo);
        return;
      }

      const partida = this.atual;
      const delta = alvo - partida;
      const duracao = this.duracaoMs();
      let frameId: number | undefined;

      const contar = (): void => {
        const inicio = performance.now();

        const passo = (agora: number): void => {
          const progresso = Math.min(1, (agora - inicio) / duracao);
          const eased = 1 - Math.pow(1 - progresso, 3);
          this.exibido.set(Math.round(partida + delta * eased));

          if (progresso < 1) {
            frameId = requestAnimationFrame(passo);
          } else {
            this.atual = alvo;
          }
        };

        frameId = requestAnimationFrame(passo);
      };

      const timeoutId = setTimeout(contar, this.atrasoMs());

      onCleanup(() => {
        clearTimeout(timeoutId);
        if (frameId !== undefined) cancelAnimationFrame(frameId);
      });
    });
  }
}
