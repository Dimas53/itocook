# Finance System

## What It Does

Manages per-user monetary accounts (balances), financial transactions, meal cost deduction, and admin financial oversight. Ensures that every meal's cost is split fairly among participants and recorded in each user's transaction history.

## Collections Used

- **`balances`** — per-user financial account. Fields: `amount` (decimal), `user` (M2O → users). One record per user. Can be negative (user owes money from past meals).
- **`transactions`** — individual financial events. Fields: `user` (M2O), `amount` (decimal, negative for deductions), `type` (string), `description` (string), `date` (timestamp).
- **`app_settings`** — singleton with `pasta_package_price` (decimal, default 1.00).

## Files Involved

- `frontend/app/composables/useDeduction.ts` — deduction logic (confirmDeduction, loadPastaCost, cleanupShoppingList)
- `frontend/app/composables/useBalanceCheck.ts` — balance gate guard (min -30 EUR threshold)
- `frontend/app/composables/useMealCost.ts` — pasta cost calculation
- `frontend/app/pages/cook.vue` — deduction triggered from ready/done states
- `frontend/app/pages/finance.vue` — admin finance dashboard
- `frontend/app/pages/profile.vue` — per-user balance + transaction history
- `frontend/app/components/BalanceWidget.vue` — home page balance snapshot
- `frontend/app/components/BalanceRow.vue` — balance row template
- `frontend/app/components/TransactionRow.vue` — transaction row template
- `frontend/app/components/ReceiptSummary.vue` — deduction breakdown template
- `frontend/server/api/deduction/confirm.post.ts` — admin-proxy for deduction
- `frontend/server/api/settings/pasta-price.get.ts` — admin-proxy for settings read
- `frontend/server/api/settings/pasta-price.patch.ts` — admin-proxy for settings update
- `frontend/server/api/users/list.ts` — admin-proxy for user list (finance page)
- `frontend/server/api/users/count.ts` — admin-proxy for user count

## Deduction Flow (Step by Step)

```
1. Cook enters receipt amount in 'ready' state
2. Cook sees preview: receipt + pasta cost = total
     ├── Pasta cost = pasta_packages × pasta_package_price
     ├── pasta_packages from: ingredients[].name == "pasta"? count → fallback to recipes.pasta_packages
     └── pasta_package_price from app_settings (fetched via /api/settings/pasta-price Nuxt proxy)

3. Cook clicks "Confirm Deduction"
     ├── useDeduction.confirmDeduction()
     │     └── POST /api/deduction/confirm (Nuxt server route)
     │           ├── requireAuth() check
     │           ├── getAdminToken() → admin Directus session
     │           ├── Fetch participants (confirmed orders for this cook_queue)
     │           ├── Fetch participant balances (batch via _in filter)
     │           ├── Compute per-person share = total / participantCount
     │           ├── Create transactions (POST /items/transactions for each participant)
     │           │     └── Parallelized with Promise.all
     │           ├── Update balances (PATCH /items/balances for each participant)
     │           │     └── Create balance record if user has none
     │           └── Cleanup shopping list → DELETE /items/shopping_list_items
     │                 (filtered by recipe ID, fallback to dish_name + cook_date)
     │
     └── On success: PATCH cook_queue status → completed
         On failure: error is displayed, no state change
```

## Balance Gate

- Minimum balance threshold: **-30 EUR** (constant `MIN_BALANCE` in `useBalanceCheck.ts`)
- Checked before:
  - `assignAsCook()` in cook.vue
  - `join()` in useParticipants.ts
- If blocked, `joinBlockedReason` is set (not thrown) so the UI can display it in `ActionBlockedModal`
- Safe fallback: if the API call fails, `check()` returns `{ allowed: true, balance: 0 }` — a network error should never prevent cooking or joining
- Users without a balance record get `balance: 0` (above threshold)

## Key Design Decisions

**Admin-proxy for deduction writes** — `confirmDeduction()` does NOT call Directus directly. It POSTs to a Nuxt server route that uses an admin Directus token. User-role tokens cannot write to other users' `balances` or `transactions`. This eliminated horizontal privilege escalation without per-collection permission changes.

**Pasta cost from two sources** — `loadPastaCost()` derives pasta package count from (1) the `ingredients` JSON array (entry named "pasta"), or (2) the `pasta_packages` field as fallback. Covers both cases: cook typed "pasta" in ingredients or used the dedicated field.

**Shopping list cleanup by two strategies** — `cleanupShoppingList()` tries recipe UUID first, then falls back to `dish_name + cook_date`. Covers both linked recipes (precise) and dish-only entries.

**Best-effort cleanup** — Shopping list deletion errors are silently caught. The deduction itself already succeeded. Cleanup is a convenience, not a consistency requirement.

**Admin-proxy for settings reads** — `fetchPastaPrice()` goes through `/api/settings/pasta-price` rather than calling Directus directly. The `app_settings` singleton is admin-only; user tokens cannot read it.

## Edge Cases & Limitations

- **First-time users** — No balance record means balance defaults to 0. The balance record is created on first deduction or admin top-up.
- **Admin overrides** — Finance page allows admin to manually top up balances, bypassing the deduction flow.
- **Pasta price caching** — `pastaPackagePrice` ref stores the last fetched value so `computePastaCost()` can be called repeatedly without network requests. Safe fallback: return 1.00 if fetch fails.
- **Ghost participants not yet billed** — Users who joined but didn't show up are not penalized (Phase 6, Task D).
- **Color coding on finance page** — BalanceWidget uses thresholds: ≥0 (bg-primary-pale), -0.01 to -5 (bg-red-50), < -5 (bg-red-100).
