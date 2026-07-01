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
5. Create `transactions` — one per participant with amount=-share
6. Create `company_transactions` — if guests present, deduct from company account
7. `PATCH /items/balances` — deduct each participant's share
8. `PATCH /items/cook_queue/{id}` → status=completed
9. `DELETE /items/shopping_list_items` — cleanup linked items

## "Cancel Cooking" Flow

1. `PATCH /items/cook_queue/{id}` → status=cancelled
2. Directus Flow triggers: Cook Cancelled notification to all users
3. `GET /items/orders` → `DELETE /items/orders/{id}` each
4. `DELETE /items/shopping_list_items` — cleanup linked items

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

## Notification Flow

```
Directus event trigger (items.create / items.update)
        │
        ├── Condition: check if notification should fire
        │     └── e.g., dish_name._nnull, status == ready
        │
        ├── Fetch related data (users, entry details)
        │
        ├── Build payload (exec JS)
        │
        ├── Trigger → Utility Flow: [Util] Create Notification
        │     └── POST /items/notifications { user, type, title, message, icon, link }
        │
        └── Request → FastAPI /api/send-push
              ├── POST { user_ids, title, message, url }
              ├── FastAPI fetches push_subscriptions by user_ids
              └── pywebpush sends to each endpoint
```

## Push Notification Subscription Flow

```
1. User logs in → useAuth.fetchUser() success
2. usePushNotifications.subscribe() called (non-blocking)
3. Check: Notification.permission === "granted"?
     ├── No → prompt user → if denied, stop
     └── Yes → continue
4. Check: existing subscription in Directus?
     ├── GET /items/push_subscriptions?filter[endpoint][_eq]=...
     ├── If exists → skip (prevent duplicates)
     └── If not → POST /items/push_subscriptions { endpoint, p256dh, auth, user }
5. On page reload: middleware/auth.global.ts → fetchUser() → subscribePush()

Push delivery:
1. Directus Flow → HTTP Request → FastAPI POST /api/send-push
2. FastAPI logs in as Directus admin
3. Fetches subscriptions by user_ids array
4. For each subscription: pywebpush.send(subscription, payload)
5. Browser Service Worker receives push event
6. push-handler.js shows system notification
7. User clicks → notificationclick event
     ├── Focus existing tab if open
     └── Open new tab → navigate to notification URL
```

## Schedule Flow Pattern

```
CRON trigger (Berlin local time)
        │
        ├── exec: get today's date
        ├── item-read: fetch relevant data
        ├── condition: check if action is needed
        ├── exec: build notification payloads
        ├── Trigger → [Util] Create Notification
        └── Request → FastAPI /api/send-push

If no action needed (e.g., no cook today):
        └── exec: throw Error → flow stops (intentional)
```

## Company Deduction Flow (Guest Feature)

```
1. Cook enters receipt in 'ready' state
2. Cook adds guest names in guest input
3. Cook confirms deduction
4. Nuxt server route /api/deduction/confirm:
     ├── Calculate per-person share
     ├── Create transactions for each participant (their share)
     ├── Create company_transactions for guest portion
     └── Update company_account.balance -= guest_portion
```
