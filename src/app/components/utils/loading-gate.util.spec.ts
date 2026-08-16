import { signal, type Signal, type WritableSignal } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

import { gateCarregamento } from './loading-gate.util';

// Único util do sistema com lógica de tempo — por isso é o único pedaço do
// conceito de loading que tem teste (a convenção do projeto é testar função
// pura, não componente de apresentação).
describe('gateCarregamento', () => {
  let fonte: WritableSignal<boolean>;
  let visivel: Signal<boolean>;

  /**
   * Precisa ser chamado DENTRO do corpo `fakeAsync`, nunca no `beforeEach`: o
   * efeito agenda seu primeiro `setTimeout` na zona em que foi criado, e criado
   * fora da zona falsa ele conta o tempo por outro relógio.
   */
  function criarGate(): void {
    fonte = signal(false);
    TestBed.runInInjectionContext(() => {
      visivel = gateCarregamento(fonte);
    });
    estabilizar();
  }

  /** Roda os efeitos pendentes — o gate reage à fonte dentro de um `effect`. */
  function estabilizar(): void {
    TestBed.tick();
    flushMicrotasks();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('já nasce visível quando a tela abre carregando, sem piscar conteúdo antes', fakeAsync(() => {
    fonte = signal(true);
    TestBed.runInInjectionContext(() => {
      visivel = gateCarregamento(fonte);
    });

    // Sem tick nenhum: no primeiro render o loader já tem que estar no ar,
    // senão o `@else` do pai pinta a tela vazia durante o atraso.
    expect(visivel()).toBe(true);

    estabilizar();
    fonte.set(false);
    estabilizar();
    tick(1000);
    expect(visivel()).toBe(false);
  }));

  it('não mostra nada quando a espera é mais curta que o atraso', fakeAsync(() => {
    criarGate();

    fonte.set(true);
    estabilizar();

    tick(200);
    fonte.set(false);
    estabilizar();

    tick(1000);
    expect(visivel()).toBe(false);
  }));

  it('mostra depois do atraso quando a espera se estende', fakeAsync(() => {
    criarGate();

    fonte.set(true);
    estabilizar();

    tick(249);
    expect(visivel()).toBe(false);

    tick(1);
    expect(visivel()).toBe(true);

    fonte.set(false);
    estabilizar();
    tick(1000);
  }));

  it('segura a permanência mínima quando o dado chega logo depois de exibir', fakeAsync(() => {
    criarGate();

    fonte.set(true);
    estabilizar();
    tick(250);
    expect(visivel()).toBe(true);

    tick(100);
    fonte.set(false);
    estabilizar();

    tick(299);
    expect(visivel()).toBe(true);

    tick(1);
    expect(visivel()).toBe(false);
  }));

  it('não pisca quando a fonte oscila enquanto o loader está no ar', fakeAsync(() => {
    criarGate();

    fonte.set(true);
    estabilizar();
    tick(250);

    fonte.set(false);
    estabilizar();
    tick(100);

    fonte.set(true);
    estabilizar();
    tick(1000);

    expect(visivel()).toBe(true);

    fonte.set(false);
    estabilizar();
    tick(1000);
    expect(visivel()).toBe(false);
  }));
});
