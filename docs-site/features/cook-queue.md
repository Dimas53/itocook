# Cook Queue & State Machine

## What It Does

Manages the daily cooking workflow: assignment of a cook, dish selection, cooking status tracking, and financial closure. The assigned cook controls the meal lifecycle through a state-machine-driven interface at `/cook`.

## Collections Used

- **`cook_queue`** — cooking assignments. Fields: `date`, `cook` (M2O → users), `dish_name`, `category`, `status` (scheduled/cooking/ready/completed/cancelled), `recipe` (M2O → recipes).
- **`orders`** — confirmed meal participation. Fields: `user` (M2O → users), `cook_queue` (M2O → cook_queue), `status` (confirmed).

## Files Involved

- `frontend/app/pages/cook.vue` — the cook panel page (state machine, all actions)
- `frontend/app/middleware/cook.ts` — route guard (only today's cook or admin bypass)
- `frontend/app/composables/useParticipants.ts` — participant list and join logic
- `frontend/app/composables/useDeduction.ts` — financial closure (confirmDeduction)
- `frontend/app/composables/useBalanceCheck.ts` — balance gate check
- `frontend/app/components/HeroBlock.vue` — "who's cooking today?" hero UI
- `frontend/app/pages/kitchen.vue` — kitchen overview with cook queue
- `frontend/app/pages/index.vue` — home page with cook info

## State Machine

```
            ┌──────────┐
            │  loading  │  (initial fetch)
            └─────┬─────┘
                  │
            ┌─────▼─────┐
            │   assign   │  (user is not cook yet — "Become cook" CTA)
            └─────┬─────┘
                  │ assignAsCook() — creates cook_queue + confirmed order for cook
            ┌─────▼─────┐
            │    dish    │  (enter dish name, category, pick recipe)
            └─────┬─────┘
                  │ saveDish() — PATCHes dish_name, category, links recipe
            ┌─────▼──────┐
            │  scheduled  │  (dish set, not cooking yet — can edit/cancel)
            └─────┬──────┘
                  │ startCooking() — PATCH status → cooking
            ┌─────▼──────┐
            │  cooking    │  (actively cooking)
            └─────┬──────┘
                  │ markReady() — PATCH status → ready
            ┌─────▼──────┐
            │   ready     │  (lunch ready — enter receipt, confirm deduction)
            └─────┬──────┘
                  │ confirmDeduction() — admin-proxy → create transactions + update balances
            ┌─────▼──────┐
            │    done     │  (status = completed)
            └────────────┘

Cancel can happen from: dish → scheduled → cooking
Cancel action: PATCH status → cancelled, DELETE all confirmed orders, cleanup shopping list
```

## Fork-on-Cook

When a cook picks a recipe owned by another user:

1. `saveDish()` checks if the recipe exists and is owned by another user
2. Creates a new recipe record (fork) — a copy with `forked_from` pointing to the original recipe ID
3. The fork is owned by the current cook (`user_created` = current user)
4. Updates the `cook_queue` entry to link to the new fork
5. On repeat cooking of the same recipe, reuses the existing fork instead of creating another

**Why this exists:** Without forks, editing a shared recipe would affect all cooks who use it. With forks, each cook gets their own version that they can modify freely.

## Key Design Decisions

- **Auto-join on assign** — `assignAsCook()` creates a `confirmed` order for the cook immediately.
- **Cancel cleans up orders + shopping list** — `cancelCooking()` deletes all confirmed orders and calls `cleanupShoppingList()`.
- **Visibility change sync** — A `document.visibilitychange` listener re-fetches queue entry status when the tab becomes visible.
- **Past-date guard** — Cook panel only works for today or future dates; past dates redirect to `/kitchen`.
- **Receipt overdue badge** — After 14:00, an overdue badge appears in the `ready` state.
- **Cook middleware bypasses for admin roles** — Non-User roles bypass queue check.

## Edge Cases & Limitations

- **Admin-injected changes** — No real-time push; cook sees changes on next visibility change.
- **Double fork prevention** — Checks for existing forks before creating a new one.
- **Ghost participants** — Users who joined but didn't show up are not yet penalized (Phase 6).
