# Shared layouts

## Authenticated application shell

- Source: `src/app/core/layout/app-shell/app-shell.component.{ts,html,scss}`
- Description: Protected routes use a sidebar or horizontal navigation, a top bar and a mobile bottom navigation. The public landing deliberately does not use this shell.

The landing is route-level and owns its own compact public navigation. It must keep the product logo language, theme tokens, Lucide iconography and pill-shaped `bdButton` actions, but it must not import the authenticated shell.

## Public landing shell

- Source: `src/app/features/landing/landing-page/landing-page.component.html`
- Description: A sticky public navigation with wordmark, login and registration actions, followed by a `page-shell` constrained marketing page and footer.

There is no separate public layout component in this Angular application.
