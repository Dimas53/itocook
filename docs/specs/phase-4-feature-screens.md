# Spec: Phase 4 — Feature Screens

## Objective

All app screens adapted to real Directus data. Cook Panel state machine, recipe CRUD, kitchen queue, duty calendar, profile, finance.

## Screens

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Today's cook, hero, join/skip, balance widget, duty widget, recipe history |
| `/kitchen` | Kitchen | Week queue, dish history, hero block synced to selected day |
| `/duty` | Duty | Today's assignment, monthly calendar, admin edit |
| `/cook` | Cook Panel | 6-state machine: assign→dish→scheduled→cooking→ready→done |
| `/profile` | Profile | Avatar, my list, my recipes, balance + transactions, logout |
| `/recipes` | All Recipes | Search, filter, grid with likes, skeleton + empty states |
| `/recipe/[id]` | Recipe Detail | Photo hero, ingredients, steps, join, like, edit, share |
| `/recipe/create` | Create/Edit | Photo upload, ingredient picker, pasta packages |
| `/finance` | Finance | All balances, top-up, transaction slider, pasta price edit |

## Key Components

- `HeroBlock.vue` — 3 states (loading/cook/empty), status badge, participant count
- `RecipeCard.vue`, `RecipeGridItem.vue` — likes, skeleton, category badge
- `BalanceWidget.vue`, `DutyWidget.vue` — home screen mini-widgets
- `WeekCalendar.vue`, `MonthCalendar.vue` — horizontal pills, monthly grid
- `ReceiptSummary.vue` — receipt rows with pasta breakdown
- `RecipeImageUpload.vue`, `AddIngredientPopover.vue`

## Key Composables

- `useParticipants.ts` — shared participant count, hasJoined, join()
- `useBalanceCheck.ts` — -30€ gate before cook/join
- `useDeduction.ts` — confirmDeduction + loadPastaCost
- `useRecipeImage.ts` — photo or category fallback

## Boundaries

- **Always:** Cook Panel state machine guards transitions, fork-on-cook for third-party recipes
- **Ask first:** Changing deduction logic, balance gate threshold, participant data model
- **Never:** Deduction without server-side share recalculation

## Key Gotchas

- `useParticipants` returns plain object → `reactive()` wrapper required in templates
- Fork-on-cook: copying a recipe sets `forked_from`, owner = current cook
- Calendar → HeroBlock sync in kitchen.vue: hero derives from selectedSlot reactively
- Recipe detail Join button only visible when active cook_queue entry exists (matched by dish_name)
- Balance gate blocks both joining AND becoming cook
- DELETE from Directus returns 204 → use `res.text()` not `res.json()`

## Success Criteria

1. All 9 screen routes render with real data from Directus
2. Cook Panel state machine: each state shows correct controls, transitions guarded
3. Recipe CRUD: create, edit, view, list, like/unlike
4. Deduction: receipt + pasta → per-user share → transactions + balance updates
5. Duty: confirm own, admin edit monthly calendar
6. Finance: all balances color-coded, top-up creates transaction
