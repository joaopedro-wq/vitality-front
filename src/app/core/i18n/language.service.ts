import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type SupportedLocale = 'pt-BR' | 'en-US';

const STORAGE_KEY = 'vitality-language';
const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);
  private readonly localeSignal = signal<SupportedLocale>(this.readInitialLocale());

  readonly locale = this.localeSignal.asReadonly();
  readonly options = [
    { id: 'pt-BR' as const, label: 'Português (Brasil)', shortLabel: 'PT' },
    { id: 'en-US' as const, label: 'English (US)', shortLabel: 'EN' },
  ] as const;

  constructor() {
    this.apply(this.localeSignal());
  }

  setLanguage(locale: SupportedLocale): void {
    if (locale === this.localeSignal()) return;
    this.localeSignal.set(locale);
    this.apply(locale);
  }

  private apply(locale: SupportedLocale): void {
    this.transloco.setActiveLang(locale);
    this.document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Continua em memória quando o armazenamento não estiver disponível.
    }
  }

  private readInitialLocale(): SupportedLocale {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'pt-BR' || saved === 'en-US') return saved;
    } catch {
      // Usa o idioma padrão abaixo.
    }

    return DEFAULT_LOCALE;
  }
}
