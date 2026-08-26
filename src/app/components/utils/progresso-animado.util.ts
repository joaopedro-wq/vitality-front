import type { WritableSignal } from '@angular/core';

export function animarProgresso(
  destino: WritableSignal<number>,
  alvo: number,
  duracaoMs: number,
): void {
  if (
    typeof window === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    destino.set(alvo);
    return;
  }

  const inicio = performance.now();
  const passo = (agora: number): void => {
    const t = Math.min(1, (agora - inicio) / duracaoMs);
    const suavizado = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    destino.set(Math.round(alvo * suavizado));
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
