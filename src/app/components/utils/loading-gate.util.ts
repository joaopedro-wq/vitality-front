import { effect, signal, untracked, type Injector, type Signal } from '@angular/core';

export interface OpcoesGateCarregamento {
  /** Espera antes de exibir. Requisição rápida não chega a mostrar nada. */
  atraso?: number;
  /** Tempo mínimo no ar depois de exibido, pra não dar flash. */
  permanencia?: number;
  /** Só quando a chamada não acontece em contexto de injeção. */
  injector?: Injector;
}

const ATRASO_PADRAO = 250;
const PERMANENCIA_PADRAO = 400;

/**
 * Converte um signal de carregamento cru num signal de *exibição*, com
 * anti-flicker: só liga depois de `atraso` e, uma vez ligado, fica no ar por no
 * mínimo `permanencia`.
 *
 * Mora aqui, e não dentro do componente de loading, porque quem decide o que
 * renderizar é o template do pai (`@if (x) {} @else {}` / `@switch`): um estado
 * interno do filho não teria como segurar o `@else`, e o loader apareceria por
 * cima do conteúdo já pintado. Com o gate, pai e loader leem o mesmo signal.
 *
 * **É só pra exibição.** `disabled`, guard e regra de negócio continuam lendo o
 * signal cru — senão dá pra clicar "próxima página" durante os 250ms iniciais.
 *
 * Chamar em contexto de injeção (inicializador de campo do componente):
 * `protected readonly carregandoVisivel = gateCarregamento(this.carregando);`
 */
export function gateCarregamento(
  fonte: Signal<boolean>,
  opcoes: OpcoesGateCarregamento = {},
): Signal<boolean> {
  const { atraso = ATRASO_PADRAO, permanencia = PERMANENCIA_PADRAO, injector } = opcoes;

  // Se a tela JÁ NASCE carregando, o loader tem que estar no primeiro render:
  // aplicar o atraso aqui faria o `@else` do pai pintar a tela vazia por 250ms
  // antes do loading, que é o inverso do que se espera. O atraso existe pra
  // recarga sobre conteúdo já visível, não pra carga inicial.
  const nasceuCarregando = untracked(fonte);

  const visivel = signal(nasceuCarregando);
  let mostradoEm = nasceuCarregando ? Date.now() : 0;

  effect(
    (onCleanup) => {
      const ligado = fonte();
      // `untracked` de propósito: o efeito depende só da fonte. Sem isso, o
      // próprio `visivel.set()` reagendaria o efeito.
      const jaVisivel = untracked(visivel);

      if (ligado === jaVisivel) return;

      if (ligado) {
        const id = setTimeout(() => {
          mostradoEm = Date.now();
          visivel.set(true);
        }, atraso);
        onCleanup(() => clearTimeout(id));
        return;
      }

      const restante = Math.max(0, permanencia - (Date.now() - mostradoEm));
      const id = setTimeout(() => visivel.set(false), restante);
      onCleanup(() => clearTimeout(id));
    },
    injector ? { injector } : undefined,
  );

  return visivel.asReadonly();
}
