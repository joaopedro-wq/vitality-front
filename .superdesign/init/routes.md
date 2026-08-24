# Routes

Router source: `src/app/app.routes.ts`.

| URL          | Entry component                                                   | Layout                       |
| ------------ | ----------------------------------------------------------------- | ---------------------------- |
| `/`          | `src/app/features/landing/landing-page/landing-page.component.ts` | Public page-owned navigation |
| `/login`     | `src/app/features/auth/login/login.component.ts`                  | Guest/auth poster            |
| `/register`  | `src/app/features/auth/register/register.component.ts`            | Guest/auth poster            |
| `/dashboard` | `src/app/features/dashboard/dashboard.component.ts`               | `AppShellComponent`          |
| `/diario`    | `src/app/features/diario/diario-list/diario-list.component.ts`    | `AppShellComponent`          |
| `/dietas`    | `src/app/features/dietas/dietas-list/dietas-list.component.ts`    | `AppShellComponent`          |
| `/metas`     | `src/app/features/metas/metas-page/metas-page.component.ts`       | `AppShellComponent`          |

The landing is guest-only through `guestGuard` and is lazy loaded. Its primary conversion route is `/register`; `/login` is the secondary action.
