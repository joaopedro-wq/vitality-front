# Vitality public landing design system

## Product and job

Vitality is a food routine app. It helps people organize a meal plan, track calories and macros, record meals, and make practical day-to-day food choices. The public page must answer: what can I do here, how much work does it take to begin, and what is the next action? It must not promise physical or clinical outcomes.

## Brand and visual boundaries

- Preserve Angular app tokens exactly: use `--bd-*` and `--sidebar-*`; never add hardcoded colors.
- Keep `var(--bd-font-sans)` for body/UI, `var(--bd-font-mono)` for small overlines, and the existing restrained Fraunces treatment for large landing headlines only.
- Cards use the existing `card` utility with padding. Main actions use `bdButton` and are fully pill-shaped.
- Use the existing heart/pulse wordmark treatment and Lucide icons. The exact supplied logo asset is `https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/projects/2cf3921f-f1e6-456c-8f3a-489d2cb5a26b/brand-assets/public-favicon.svg/favicon.svg`; do not use emoji or a replacement logo.
- Keep the page-shell max width (72rem), generous vertical spacing, thin token borders and soft, token-based shadows.
- Both light and dark palettes must work through CSS variables. Avoid white overlays and fixed dark backgrounds that break alternate palettes.

## Page hierarchy

1. Public nav: wordmark, login, clear registration CTA.
2. Hero: short statement about organized eating for everyday life, two actions and a realistic dashboard/diary preview.
3. Four practical benefits: plan, macros, meal logging, food swaps. Each is concise and icon-led.
4. Three-step start: goals/preferences, organized plan, record and follow the day.
5. Feature showcase: one selected feature at a time with a real app screenshot; use tabs or accessible segmented buttons, not a carousel that advances itself.
6. Responsible note: neutral `role="note"` card, clearly saying the product gives general food suggestions and does not replace a nutrition professional, especially for clinical conditions.
7. FAQ only for sign-up blockers; then a simple final registration CTA and brief footer.

## Content style

Use short, human Brazilian Portuguese sentences. Speak of organization, routine, tracking and choices. Avoid technical nutrition formulas, AI/model names, unverified quantities, gamification, confrontation with other products and urgency claims. The English locale must carry the same meaning, not a literal machine translation.

## Motion and accessibility

- Use `BdRevealDirective` for individual viewport entries with short sequential delays. Do not animate every object at once.
- Use only non-looping transition/microinteraction motion; any macro/demo progress should animate once on entrance and have a static readable value.
- Respect reduced motion by disabling custom animations and transitions within the component media query.
- Use native anchors/buttons, visible focus states supplied by the design system, semantic sections with headings, descriptive screenshot alt text, and no meaning conveyed by color alone.

## Responsive behavior

Mobile is the base: actions wrap or stack without reducing touch targets; benefit cards and how-it-works steps become one column; screenshots do not force horizontal scrolling. Tablet moves to two columns only when content has room; desktop puts the hero copy and preview side by side. Keep text blocks within readable measure and reduce visual chrome before shrinking type.
