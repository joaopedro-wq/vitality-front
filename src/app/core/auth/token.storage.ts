import { Injectable } from '@angular/core';

const TOKEN_KEY = 'vtp_token';

/** Wrapper fino sobre localStorage — isola o nome da chave e facilita trocar a estratégia depois. */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}
