# Extractable components

## LanguageSelector

- Source: `src/app/components/molecules/language-selector/language-selector.component.ts`
- Category: basic
- Description: Toggles the active Transloco locale.
- Extractable props: none.
- Hardcoded: locale labels, flag symbols and CSS classes.

## AppShell

- Source: `src/app/core/layout/app-shell/app-shell.component.html`
- Category: layout
- Description: Protected app navigation and top bar.
- Extractable props: activeItem, userName, isDark, layoutMode.
- Hardcoded: routes, Lucide icon choices, product wordmark and CSS classes.

## LandingPublicNav

- Source: `src/app/features/landing/landing-page/landing-page.component.html`
- Category: layout
- Description: Public sticky navigation for the landing only.
- Extractable props: none.
- Hardcoded: product wordmark, login/register routes and section anchor.
