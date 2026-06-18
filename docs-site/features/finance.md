# Finance & Balance

## What It Does

Manages per-user monetary accounts (balances), financial transactions, meal cost deduction, and admin financial oversight. Every meal's cost is split fairly among participants.

## Collections Used

- **`balances`** — per-user financial account. One record per user. Can be negative.
- **`transactions`** — individual financial events. Fields: `user`, `amount`, `type`, `description`, `date`.
- **`app_settings`** — singleton with `pasta_package_price` (decimal, default 1.00).

## Files Involved

- `frontend/app/composables/useDeduction.ts` — deduction logic
- `frontend/app/composables/useBalanceCheck.ts` — balance gate guard
- `frontend/app/composables/useMealCost.ts` — pasta cost calculation
- `frontend/app/pages/cook.vue` — deduction triggered from ready/done states
- `frontend/app/pages/finance.vue` — admin finance dashboard
- `frontend/app/components/BalanceWidget.vue` — home page balance snapshot
- `frontend/server/api/deduction/confirm.post.ts` — admin-proxy for deduction

## Deduction Flow

```
1. Cook enters receipt amount in 'ready' state
2. Cook sees preview: receipt + pasta cost = total
     ├── Pasta cost = pasta_packages × pasta_package_price
     └── pasta_package_price from app_settings

3. Cook clicks "Confirm Deduction"
     └── POST /api/deduction/confirm (Nuxt server route)
           ├── requireAuth() check
           ├── getAdminToken() → admin Directus session
           ├── Fetch participants (confirmed orders)
           ├── Compute per-person share = total / participantCount
           ├── Create transactions for each participant
           ├── Update balances for each participant
           └── Cleanup shopping list
     └── On success: PATCH cook_queue status → completed
```

## Balance Gate

- Minimum balance threshold: **-30 EUR**
- Checked before: `assignAsCook()` and `join()`
- Safe fallback: API failure returns `{ allowed: true, balance: 0 }`
- Users without a balance record get `balance: 0` (above threshold)

## Key Design Decisions

- **Admin-proxy for deduction writes** — User-role tokens cannot write to other users' balances or transactions.
- **Pasta cost from two sources** — ingredients JSON array or dedicated `pasta_packages` field.
- **Shopping list cleanup by two strategies** — recipe UUID first, dish_name + cook_date fallback.
- **Best-effort cleanup** — Errors silently caught; deduction already succeeded.
- **Admin-proxy for settings reads** — `app_settings` is admin-only; user tokens cannot read it.

## Edge Cases & Limitations

- **First-time users** — No balance record means balance defaults to 0.
- **Admin overrides** — Finance page allows manual top-up, bypassing deduction.
- **Pasta price caching** — Safe fallback: return 1.00 if fetch fails.
- **Ghost participants not yet billed** — Phase 6, Task D.
