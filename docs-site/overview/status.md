# Project Status

## Frontend File Structure

```
frontend/
  app/
    app.vue
    layouts/
      default.vue         — iPhone frame wrapper (Dynamic Island, BottomTabBar)
      app.vue              — auth-gated layout (Sidebar, participant modal)
    pages/
      onboarding.vue       — first-launch intro carousel
      auth.vue             — login / register
      index.vue            — Home: HeroBlock, BalanceWidget, DutyWidget, Recent Dishes
      kitchen.vue          — WeekCalendar, HeroBlock, Dish History, ShoppingListWidget
      cook.vue             — Cook Panel: 6-state machine, fork, receipt, deduction
      recipe/[id].vue      — Recipe detail: photo, steps, servings scaler, join, like
      recipe/create.vue    — Recipe create/edit: photo upload, ingredients, steps
      recipes.vue          — All Recipes: search, category filter, RecipeGridItem grid
      profile.vue          — My List, My Recipes, Preferences, balance
      finance.vue          — Admin: all balances, top-up, transactions, pasta price
      duty.vue             — Duty roster: today card, MonthCalendar, admin edit mode
      shopping-list.vue    — By Recipe / All Items tabs, select-all, delete-checked
      ai-recipe.vue        — Placeholder (Phase 3)
      common.vue           — Placeholder (Phase 3)
    components/            — 18 reusable components (HeroBlock, RecipeCard, etc.)
    composables/           — 12 composables (useDirectus, useAuth, useDeduction, etc.)
    middleware/            — auth.global.ts, cook.ts
    utils/                 — dates.ts, dedupRecipes.ts, ingredientIcons.ts, etc.
  server/
    api/                   — 9 admin-proxy server routes
    utils/                 — adminToken.ts, auth.ts
```

## Page Status

### Fully Working

| Page | Route | Notes |
|---|---|---|
| Onboarding | `/onboarding` | Flexible layout, TypeScript |
| Auth | `/auth` | Login/register, form validation, token in cookie |
| Home | `/` | HeroBlock, BalanceWidget, DutyWidget, Recent Dishes |
| Kitchen | `/kitchen` | WeekCalendar, HeroBlock, Dish History, ShoppingListWidget |
| Cook Panel | `/cook` | 6-state machine, cancel, fork, balance gate, receipt+deduction |
| Recipe Detail | `/recipe/[id]` | Photo, join, servings scaler, like, steps |
| Recipe Create/Edit | `/recipe/create` | Photo upload, ingredient editor, prefill from history |
| All Recipes | `/recipes` | Search + category filter, grid with likes |
| Profile | `/profile` | Avatar upload, My List, My Recipes, Preferences, balance |
| Finance | `/finance` | Admin only — balances, top-up, transactions, pasta price |
| Duty | `/duty` | Today's duty card, MonthCalendar, admin edit mode |
| Shopping List | `/shopping-list` | By Recipe / All Items tabs, select-all, delete checked |

### Partial / Needs Polish

| Page | Missing |
|---|---|
| Profile | Statistics, notification settings |
| Kitchen | Weekly menu, anonymous ratings |

### Not Started

| Page | Route | What's needed |
|---|---|---|
| AI Recipe | `/ai-recipe` | Chat UI, JSON recipe render, "Add to recipes" |
| Common | `/common` | Announcements, pool collections, progress bars |

## Composables Overview

| Composable | Purpose |
|---|---|
| `useDirectus` | Core HTTP client with Bearer token |
| `useAuth` | Auth lifecycle (login, signUp, logout, fetchUser) |
| `useDeduction` | Meal deduction logic |
| `useParticipants` | Participant CRUD |
| `useParticipantsModal` | Global participant list modal |
| `useBalanceCheck` | Balance gate (-30 EUR threshold) |
| `useMealCost` | Pasta cost calculation |
| `useRecipeImage` | Recipe image resolution |
| `useRecipeServings` | Ingredient scaling by servings |
| `useLikes` | Recipe like/unlike |
| `useTotalUsers` | Total user count |
