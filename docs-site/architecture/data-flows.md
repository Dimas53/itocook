# Data Flows

## "Become Cook" Flow

1. **Balance Gate check** — `useBalanceCheck.check()` prevents cook assignment if balance < -30 EUR
2. `POST /items/cook_queue` — create entry with `cook`=current user, `status`=scheduled
3. `POST /items/orders` — auto-create `confirmed` order for the cook
4. Later: `PATCH /items/cook_queue/{id}` → status=cooking → status=ready
5. (Optional from recipe detail) `POST /items/orders` — other users join (also balance-gated)

## "Save Dish" Flow (Cook Panel)

1. `PATCH /items/cook_queue/{id}` — set `dish_name`, `category`, `status=scheduled`
2. If matching recipe exists by `dish_name`:
   - If user owns it: link directly
   - If another user owns it: fork (create copy with `forked_from`=original)
3. `PATCH /items/cook_queue/{id}` — link `recipe` to the (forked) recipe
4. On repeat cooking: reuse existing fork instead of creating another copy

## "Confirm Deduction" Flow (admin-proxy)

1. Frontend → Nuxt server route `POST /api/deduction/confirm`
2. Server obtains admin token via `getAdminToken()`
3. Fetch participants via `GET /items/orders?filter[cook_queue][_eq]`
4. Fetch pasta cost from `app_settings`
5. `POST /items/transactions` — one per participant with `amount`=-share
6. `PATCH /items/balances` — deduct each participant's share
7. `PATCH /items/cook_queue/{id}` → status=completed
8. `DELETE /items/shopping_list_items` — cleanup linked items

## "Cancel Cooking" Flow

1. `PATCH /items/cook_queue/{id}` → status=cancelled
2. `GET /items/orders` → `DELETE /items/orders/{id}` each
3. `DELETE /items/shopping_list_items` — cleanup linked items

## Signup Flow (admin-proxy)

1. Frontend → Nuxt server route `POST /api/auth/signup`
2. Server validates: email format, password strength (8+ chars, upper+lower+digit), name length
3. IP-based rate limit: max 5 requests / 60s sliding window
4. Server obtains admin token via `getAdminToken()`
5. `POST /users` — Directus Admin API creates user with User role
6. Returns `{ success: true }` or forwards Directus error

## Fork-on-Cook Flow

1. User B cooks User A's recipe
2. `POST /items/recipes` — create copy with `forked_from`=A's recipe, `cook`=B
3. `PATCH /items/cook_queue/{id}` — link `recipe` to the new fork
4. `dedupRecipes` shows only the latest fork per `dish_name` in recipe lists

## Shopping List Flow

1. From recipe detail: `POST /items/shopping_list_items` — one per scaled ingredient
2. Auto-deleted on `confirmDeduction` or `cancelCooking`
3. `is_checked` toggled via `PATCH` in shopping list UI
