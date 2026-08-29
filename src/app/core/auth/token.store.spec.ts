import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { TOKEN_WEB_STORAGE_KEY, TokenStore } from './token.store';

const LEGACY_KEY = 'vitality_token';

describe('TokenStore', () => {
  let store: TokenStore;

  beforeEach(async () => {
    localStorage.clear();
    await Preferences.clear();

    TestBed.configureTestingModule({});
    store = TestBed.inject(TokenStore);
  });

  afterEach(async () => {
    localStorage.clear();
    await Preferences.clear();
  });

  it('começa sem token quando não há nada guardado', async () => {
    await expectAsync(store.load()).toBeResolvedTo(null);
    expect(store.token()).toBeNull();
  });

  it('lê o token já persistido', async () => {
    store.set('abc123');

    // Uma instância nova enxerga o que a anterior gravou — é o caso do app
    // sendo morto e reaberto.
    const outro = new TokenStore();
    await expectAsync(outro.load()).toBeResolvedTo('abc123');
    expect(outro.token()).toBe('abc123');
  });

  it('migra o token da chave crua antiga sem deslogar quem já estava logado', async () => {
    localStorage.setItem(LEGACY_KEY, 'token-da-web-antiga');

    await expectAsync(store.load()).toBeResolvedTo('token-da-web-antiga');
    expect(store.token()).toBe('token-da-web-antiga');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(localStorage.getItem(TOKEN_WEB_STORAGE_KEY)).toBe('token-da-web-antiga');
  });

  it('não deixa a chave antiga sobrescrever uma sessão mais nova', async () => {
    store.set('token-atual');
    localStorage.setItem(LEGACY_KEY, 'token-antigo');

    await expectAsync(store.load()).toBeResolvedTo('token-atual');
  });

  it('publica o token na hora, antes de terminar de persistir', () => {
    store.set('imediato');

    // O authInterceptor lê no caminho síncrono da requisição: se dependesse do
    // await do Preferences, a primeira chamada após o login sairia sem header.
    expect(store.token()).toBe('imediato');
  });

  it('limpa o token guardado', async () => {
    store.set('para-remover');
    store.clear();

    expect(store.token()).toBeNull();
    await expectAsync(store.load()).toBeResolvedTo(null);
  });
});
