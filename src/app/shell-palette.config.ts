/**
 * Lista de paletas do sistema — fonte única, sem duplicação. Consumida por
 * `app.config.ts` (via `provideShell()`) E por `scripts/sync-index-html.mjs`
 * (roda em Node puro com `--experimental-strip-types`, antes do `ng serve`/
 * `ng build`, para regenerar o script anti-flash de `index.html`).
 *
 * Por isso este arquivo não pode importar nada de Angular/Lucide/etc — só
 * dados planos, senão o script Node deixa de conseguir carregá-lo.
 */
export interface PaletaConfig {
  id: string;
  label: string;
  swatch: string;
}

export const DEFAULT_PALETTE_ID = 'horta';

export const PALETAS: PaletaConfig[] = [
  { id: 'horta', label: 'Horta', swatch: '#5c7a3f' },
  { id: 'especiaria', label: 'Especiaria', swatch: '#a9673a' },
  { id: 'salvia', label: 'Sálvia', swatch: '#7c9473' },
  { id: 'ameixa-reversa', label: 'Ameixa Reversa', swatch: '#6b3f57' },
];
