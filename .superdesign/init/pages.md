# Key page dependency trees

## / (Landing)

Entry: `src/app/features/landing/landing-page/landing-page.component.ts`

Dependencies:

- `src/app/features/landing/landing-page/landing-page.component.html`
- `src/app/features/landing/landing-page/landing-page.component.scss`
- `src/app/core/i18n/language.service.ts`
- `src/styles.scss`
- `public/i18n/pt-BR.json`
- `public/i18n/en-US.json`
- `public/images/landing/dashboard.png`
- `public/images/landing/metas.png`
- `public/images/landing/diario.png`
- `public/images/landing/alimentos.png`
- `public/images/landing/dietas-plano-gerado.png`

## /diario (Diary)

Entry: `src/app/features/diario/diario-list/diario-list.component.ts`

Dependencies:

- `src/app/features/diario/diario-list/diario-list.component.html`
- `src/app/components/molecules/macro-goal-strip/macro-goal-strip.component.ts`
- `src/app/components/organisms/journey-map/journey-map.component.ts`
- `src/app/components/molecules/diary-phase-card/diary-phase-card.component.ts`
- `src/app/features/diario/entry-composer/entry-composer.component.ts`
- `src/app/features/diario/meal-manager/meal-manager.component.ts`

## /dietas (Meal plans)

Entry: `src/app/features/dietas/dietas-list/dietas-list.component.ts`

Dependencies:

- `src/app/features/dietas/meal-plan-preview/meal-plan-preview.component.ts`
- `src/app/features/dietas/meal-plan-preview/meal-plan-preview.component.html`
- `src/app/features/dietas/meal-plan-preview/macro-ticket/macro-ticket.component.ts`
- `src/app/components/organisms/meal-drawer/meal-drawer.component.ts`
- `src/app/components/molecules/meal-plate/meal-plate.component.ts`

## /dashboard

Entry: `src/app/features/dashboard/dashboard.component.ts`

Dependencies:

- `src/app/features/dashboard/dashboard.component.html`
- `src/app/features/dashboard/components/badge-card/badge-card.component.ts`
- `src/app/features/dashboard/components/mission-card/mission-card.component.ts`
- `src/app/features/dashboard/components/missions-card/missions-card.component.ts`
- `src/app/features/dashboard/components/week-trail/week-trail.component.ts`
