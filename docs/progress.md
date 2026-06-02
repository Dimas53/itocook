# ItoCook — Progress Log

## Current status
- [x] Project structure set up (frontend/, api/, directus/)
- [x] Docker running (Nuxt + Directus + PostgreSQL)
- [x] iPhone frame layout (`layouts/default.vue`)
- [x] Onboarding screen — fully fixed (flex layout, TypeScript)
- [x] Auth screen — partially built (needs cleanup)
- [x] Tailwind CSS installed with custom config
- [x] Jost font imported, global styles in `main.css`
- [x] Phosphor Icons installed
- [x] Tailwind config full sync — all 13 color tokens registered
- [x] `auth-bg: '#EDE8FF'` added to tailwind + design.md
- [x] Auth screen refactored — auth-bg token, transparent inputs, rounded-xl, branding fixed
- [x] Auth input interaction states — bg-white/40, focus:bg-white, focus:border-primary
- [x] Nuxt config fixed — main.css uncommented, stale .nuxt cache cleared
- [x] `onboarding.vue` — `absolute inset-0` → `h-full`, добавлен `lang="ts"`
- [x] `components/BottomTabBar.vue` — 5 табов с Phosphor icons, активный/неактивный стиль
- [x] `default.vue` — таббар встроен, скрывается на /onboarding и /auth

## Known issues
- ~~**Tailwind config incomplete:** 5 missing color tokens — fixed~~
- ~~**#EDE8FF used as primary-light:** — fixed (now dedicated `auth-bg` token)~~
- ~~**Auth screen uses hardcoded colors:** `bg-[#EDE8FF]` — fixed~~
- ~~**Auth screen references wrong app name:** "ekilu" → "ItoCook" — fixed~~
- ~~**Auth screen input radius wrong:** `rounded-2xl` → `rounded-xl` — fixed~~
- **Layout safe areas:** `pt-[60px]` / `pb-[34px]` будут на каждой странице индивидуально (в `default.vue` ломают auth) (Milestone 2)
- **`darkStatus` feature half-implemented:** computed свойство есть, класс `invert` закомментирован (Milestone 3)
- **Index page is placeholder:** только редиректит на `/onboarding` (Milestone 4)
- **Components directory missing:** нет BottomTabBar, RecipeCard, CategoryPill, MacroRing (Milestone 2)
- **7 из 10 экранов не созданы:** meal-plan, ai-recipe, journal, learning, profile, recipe/[id] (Milestone 4)

## Next session — Roadmap & Plan

### Milestone 1: UI Foundation & Design System Sync
- [x] Fix `tailwind.config.ts` — all 13 tokens registered
- [x] Add `auth-bg: '#EDE8FF'` token to tailwind.config.ts + docs/design.md
- [x] Fix `onboarding.vue` — replace `absolute inset-0` with flex layout, add `lang="ts"`
- [x] Fix `auth.vue` — bg-auth-bg, transparent inputs rounded-xl, branding ItoCook
- [x] Fix auth input interaction states — bg-white/40, focus modifiers
- [x] Fix nuxt.config — main.css uncommented, stale .nuxt cache cleared

### Milestone 2: Layout & Global Navigation
- Safe-area padding (`pt-[60px]` / `pb-[34px]`) — per-page, не глобально (auth/onboarding ломаются)
- [x] Create `components/` directory
- [x] Build `BottomTabBar.vue` — 5 tabs with Phosphor icons, active/inactive states
- [x] Wire tab bar into `default.vue` (show only on authenticated screens, hide on onboarding/auth)

### Milestone 3: Core Authentication Flow
- Clean up `auth.vue` — proper form validation, error states, loading state
- Connect to Directus auth endpoint (or stub for now)
- Fix `darkStatus` — uncomment the `invert` class in layout, ensure it works with `definePageMeta`
- Add post-login redirect logic to `index.vue`

### Milestone 4: Feature Screens Onboarding
- Build Home screen (`index.vue`) — greeting, search bar, category pills, recipe cards
- Build remaining screens: Meal Plan, AI Recipe, Journal, Learning, Profile, Recipe Detail
- Build supporting components: `RecipeCard.vue`, `CategoryPill.vue`, `MacroRing.vue`
- Wire all screens into tab navigation with proper routing

### Milestone 5: Backend Integration & Real Data
- Connect frontend to Directus SDK for user auth and recipe data
- Build FastAPI endpoints for split calculation, notifications
- Implement real data flow from Directus collections through to UI

## Git log
- `94fc7a4` — feat(onboarding): replace absolute layout with flex, add lang=ts
