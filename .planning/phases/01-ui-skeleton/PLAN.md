# Phase 1: UI Skeleton

## Goal
Static UI foundation — can open the app, navigate through screens, see the layout of all screens. No real data, only visuals.

## Completed
- Design system established — color tokens (13 colors), Jost font, Tailwind config
- iPhone frame layout (`layouts/default.vue`) with Dynamic Island, status bar, safe areas
- Onboarding screen — flex layout, chef illustration, `"Quick & Easy Recipes!"`
- Auth screen — Log In / Sign Up toggle, form fields, basic layout
- `BottomTabBar.vue` — 5 tabs with Phosphor icons (Home, Meal Plan, AI Recipe, Journal, Learning), active/inactive states
- Tab bar integrated in `default.vue`, hidden on `/onboarding` and `/auth`
- Auth flow — form validation, error states, loading state, fake login with hardcoded user
- Redirect after login to Home
- Route protection — redirect to `/auth` if not logged in
- TypeScript: all `.vue` files use `<script setup lang="ts">`
- Tailwind config full sync — all 13 tokens
- Nuxt config — `main.css` connected
- Dark status bar — `invert` CSS in layout

## Key decisions
- Used iPhone 17 Pro mockup frame (390x844px) with `rounded-[50px]` border
- Jost font as visual replacement for Lufga (geometric grotesque)
- Phosphor Icons as icon library
- Fixed px for all sizes (no responsive breakpoints — mobile-only)
- No hover effects, only `active:scale` for tap feedback
- Fake auth (hardcoded user) deferred real backend to Phase 2

## Key files created/modified
- `frontend/app/layouts/default.vue`, `frontend/app/layouts/app.vue`
- `frontend/app/pages/index.vue`, `auth.vue`, `onboarding.vue`
- `frontend/app/components/BottomTabBar.vue`, `RecipeCard.vue`, `CategoryPill.vue`, `HeroBlock.vue`, `WeekCalendar.vue`
- `frontend/app/composables/useDirectus.ts`, `useAuth.ts`
- `frontend/app/assets/css/main.css`
- `frontend/nuxt.config.ts`, `frontend/tailwind.config.ts`

## Status
DONE ✅ — 2026-06-02
