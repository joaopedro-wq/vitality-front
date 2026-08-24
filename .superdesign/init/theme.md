# Theme

## Compact token summary

- Framework: Angular 20 standalone components with OnPush and Tailwind v4 utilities; component SCSS is used for rules Tailwind cannot express.
- Typography: `var(--bd-font-sans)` for interface text, `var(--bd-font-mono)` for small labels/wordmark. The current landing uses Fraunces only for marketing headings.
- Surfaces: `--bd-bg` page background; `--bd-surface` cards; `--bd-surface-hover` hover state; `--bd-border` default border; `--bd-fg`, `--bd-fg-muted`, `--bd-fg-subtle` text hierarchy.
- Brand: `--bd-primary`, `--bd-primary-strong`, `--bd-primary-soft`, `--bd-primary-contrast`; sidebar/chrome uses `--sidebar-bg`, `--sidebar-fg`, `--sidebar-fg-muted`. Values vary by user-selected palette and light/dark theme; never hardcode colors.
- Layout: `.page-shell` is max 72rem / 1152px; `.page-shell-wide` max 87.5rem / 1400px. `card` is surface + border + 20px radius and always needs its own padding.
- Buttons: `bdButton` is the only CTA primitive and is globally pill-shaped. `primary` is the main action; `ghost` is secondary.
- Motion: `BdRevealDirective` handles viewport entry. Global reduced-motion shortens animations/transitions; landing-specific motion must explicitly turn off nonessential looping effects.
- Breakpoints in existing landing: 860px switches two-column areas to one; 520px changes compact grids to one column. Mobile-first additions should use tokenized responsive Tailwind utilities where possible.

## Raw source references

- `src/styles.scss` defines all product tokens, palette/theme variants, `card`, page-shell utilities, and global reduced-motion behavior.
- `src/app/features/landing/landing-page/landing-page.component.scss` contains the current landing-specific styling.
