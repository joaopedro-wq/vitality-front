import { Injectable, signal } from '@angular/core';

export type NavigationLayout = 'sidebar' | 'horizontal';

const STORAGE_KEY = 'navigation-layout';

@Injectable({ providedIn: 'root' })
export class NavigationLayoutService {
  private readonly layoutSignal = signal<NavigationLayout>(this.readInitialLayout());
  readonly layout = this.layoutSignal.asReadonly();

  toggle(): void {
    const next = this.layoutSignal() === 'sidebar' ? 'horizontal' : 'sidebar';
    this.layoutSignal.set(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponível — mantém a escolha enquanto a sessão estiver aberta.
    }
  }

  private readInitialLayout(): NavigationLayout {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'horizontal' ? 'horizontal' : 'sidebar';
    } catch {
      return 'sidebar';
    }
  }
}
