// `@primeng/themes` foi descontinuado a favor de `@primeuix/themes` — mesmo
// pacote por trás (`@primeng/themes/aura` só reexportava daqui), sem o aviso
// de depreciação nem a armadilha da faixa "-lts" (paga, ver nota no
// package.json/CLAUDE.md).
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const VitalityPrimeNgPreset = definePreset(Aura, {
  semantic: {
    focusRing: {
      color: 'var(--bd-primary)',
    },
    colorScheme: {
      light: {
        primary: {
          color: 'var(--bd-primary)',
          contrastColor: 'var(--bd-primary-contrast)',
          hoverColor: 'var(--bd-primary-strong)',
          activeColor: 'var(--bd-primary-strong)',
        },
        content: {
          background: 'var(--bd-surface)',
          hoverBackground: 'var(--bd-surface-hover)',
          borderColor: 'var(--bd-border)',
          color: 'var(--bd-fg)',
          hoverColor: 'var(--bd-fg)',
        },
        text: {
          color: 'var(--bd-fg)',
          hoverColor: 'var(--bd-fg)',
          mutedColor: 'var(--bd-fg-muted)',
          hoverMutedColor: 'var(--bd-fg-muted)',
        },
        highlight: {
          background: 'var(--bd-primary-soft)',
          focusBackground: 'var(--bd-primary-soft)',
          color: 'var(--bd-primary-strong)',
          focusColor: 'var(--bd-primary-strong)',
        },
        surface: {
          50: 'var(--bd-surface-hover)',
        },
      },
    },
  },
});
