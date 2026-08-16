import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

import { LoadingStateComponent } from '../../molecules/loading-state/loading-state.component';

const TROCA_MENSAGEM_MS = 2200;

@Component({
  selector: 'vtp-loading-overlay',
  standalone: true,
  imports: [LoadingStateComponent],
  templateUrl: './loading-overlay.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  readonly ativo = input(false);
  readonly titulo = input('Trabalhando nisso…');
  readonly descricao = input<string | undefined>(undefined);
  readonly mensagens = input<string[]>([]);

  private readonly indiceMensagem = signal(0);

  protected readonly descricaoAtual = computed(() => {
    const lista = this.mensagens();
    return lista.length ? lista[this.indiceMensagem() % lista.length] : this.descricao();
  });

  constructor() {
    effect((onCleanup) => {
      const lista = this.mensagens();
      if (!this.ativo() || lista.length < 2) {
        this.indiceMensagem.set(0);
        return;
      }

      const id = setInterval(() => {
        this.indiceMensagem.update((i) => (i + 1) % lista.length);
      }, TROCA_MENSAGEM_MS);
      onCleanup(() => clearInterval(id));
    });
  }
}
