import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'vitality_token';

const LEGACY_WEB_KEY = 'vitality_token';

export const TOKEN_WEB_STORAGE_KEY = `CapacitorStorage.${TOKEN_KEY}`;

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly tokenSignal = signal<string | null>(null);

  readonly token = this.tokenSignal.asReadonly();

  /** Hidrata o signal antes da primeira navegação. Chamado no `provideAppInitializer`. */
  async load(): Promise<string | null> {
    let token: string | null = null;

    try {
      token = (await Preferences.get({ key: TOKEN_KEY })).value;
    } catch {
      // Armazenamento indisponível: segue sem sessão restaurada.
    }

    if (!token) {
      token = await this.migrateLegacyWebToken();
    }

    this.tokenSignal.set(token);

    return token;
  }

  /** Publica o token para os interceptors na hora e persiste em segundo plano. */
  set(token: string): void {
    this.tokenSignal.set(token);
    void Preferences.set({ key: TOKEN_KEY, value: token }).catch(() => {
      // Sessão continua válida em memória mesmo sem conseguir persistir.
    });
  }

  clear(): void {
    this.tokenSignal.set(null);
    void Preferences.remove({ key: TOKEN_KEY }).catch(() => {
      // Nada a fazer: o signal já está limpo e o guard bloqueia a navegação.
    });
  }

  /**
   * Move o token da chave crua antiga para o `Preferences`. Só acontece uma vez
   * por navegador — depois disso a chave antiga não existe mais.
   */
  private async migrateLegacyWebToken(): Promise<string | null> {
    let legado: string | null = null;

    try {
      legado = localStorage.getItem(LEGACY_WEB_KEY);
    } catch {
      return null;
    }

    if (!legado) return null;

    try {
      await Preferences.set({ key: TOKEN_KEY, value: legado });
      localStorage.removeItem(LEGACY_WEB_KEY);
    } catch {
      // Se a gravação falhar, mantém a chave antiga para tentar de novo depois.
    }

    return legado;
  }
}
