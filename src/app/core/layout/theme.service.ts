import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly themeSignal = signal<Theme>(this.readInitialTheme());
  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    this.apply(this.themeSignal());
  }

  toggle(): void {
    const next: Theme = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.themeSignal.set(next);
    this.apply(next);
  }

  private apply(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage indisponível (modo privado/SSR) — segue só em memória.
    }
  }

  private readInitialTheme(): Theme {
    const attr = this.document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') {
      return attr;
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
