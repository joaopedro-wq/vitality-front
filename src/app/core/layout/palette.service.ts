import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type PaletteId = 'horta' | 'especiaria' | 'salvia' | 'ameixa-reversa';

const STORAGE_KEY = 'palette';
const DEFAULT_PALETTE: PaletteId = 'horta';
const PALETTE_IDS: PaletteId[] = ['horta', 'especiaria', 'salvia', 'ameixa-reversa'];

export interface PaletteOption {
  id: PaletteId;
  label: string;
  /** Cor usada no swatch do seletor — mesmo valor do `--bd-primary` claro dessa paleta. */
  swatch: string;
}

/** Ordem em que aparecem no seletor da topbar. */
export const PALETAS: PaletteOption[] = [
  { id: 'horta', label: 'Horta', swatch: '#5c7a3f' },
  { id: 'especiaria', label: 'Especiaria', swatch: '#a9673a' },
  { id: 'salvia', label: 'Sálvia', swatch: '#7c9473' },
  { id: 'ameixa-reversa', label: 'Ameixa Reversa', swatch: '#6b3f57' },
];

/**
 * Paleta de cor do sistema (primary + cor do menu/poster de auth) — independente
 * do tema claro/escuro (`ThemeService`). Mesmo padrão de implementação: signal +
 * `data-*` no `documentElement` + `localStorage`, lido antes do Angular bootar
 * pelo script anti-flash em `index.html`.
 */
@Injectable({ providedIn: 'root' })
export class PaletteService {
  static readonly PALETAS = PALETAS;

  private readonly document = inject(DOCUMENT);

  private readonly paletteSignal = signal<PaletteId>(this.readInitialPalette());
  readonly palette = this.paletteSignal.asReadonly();

  readonly paletas = PaletteService.PALETAS;

  constructor() {
    this.apply(this.paletteSignal());
  }

  set(id: PaletteId): void {
    if (id === this.paletteSignal()) return;
    this.paletteSignal.set(id);
    this.apply(id);
  }

  private apply(id: PaletteId): void {
    this.document.documentElement.setAttribute('data-palette', id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage indisponível (modo privado/SSR) — segue só em memória.
    }
  }

  private readInitialPalette(): PaletteId {
    const attr = this.document.documentElement.getAttribute('data-palette');
    if (this.isPaletteId(attr)) return attr;
    return DEFAULT_PALETTE;
  }

  private isPaletteId(value: string | null): value is PaletteId {
    return !!value && (PALETTE_IDS as string[]).includes(value);
  }
}
