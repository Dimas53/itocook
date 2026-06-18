# ItoCook — Architecture

## Core layer: useDirectus (`frontend/app/composables/useDirectus.ts`)

The single HTTP client that all frontend-to-Directus communication passes through. It wraps `fetch` with auto-attached Bearer token from `directus_token` cookie, unwraps Directus `{ data: ... }` responses, and parses Directus errors into plain `Error` objects.

Key design decisions:
- **Cookie-based token storage** (not `localStorage`): survives page reloads, but forces `httpOnly: false` because JS needs to read the token to attach the `Authorization` header. This is a conscious trade-off: Directus CORS policy prevents direct browser→Directus cross-origin auth for non-public endpoints, so the token must be readable by the client app.
- **`res.text()` + conditional `JSON.parse()`** instead of `res.json()`: required because Directus DELETE endpoints return `204 No Content` with an empty body. `res.json()` would throw on empty responses.
- **File upload folder fallback**: `uploadFile()` performs a secondary `PATCH /files/{id}` because some Directus versions ignore the `folder` field on the initial `POST /files`. If the PATCH fails, the file is still uploaded but un-filed — a warning is logged but no error is thrown.
- **Single point of change**: all API calls across 15+ files (composables, pages, components, middleware) go through `request()`. This means auth header injection, error handling, and response parsing are maintained in one place.

## Auth layer: useAuth (`frontend/app/composables/useAuth.ts`)

Manages the full authentication lifecycle — registration, login, logout, user state fetching, and cook-status check. All Directus calls go through `useDirectus.request()`, keeping auth-header injection centralised in one composable. The user object is stored in `useState('auth:user')` for cross-app reactivity.

Key design decisions:
- **Admin-proxied registration**: `signUp()` does not call Directus directly — it fetches a Nuxt server route (`POST /api/auth/signup`) that proxies to the Directus Admin API. Regular User-role tokens lack `directus_users` create permission, so admin escalation is required for new user creation.
- **Immediate auto-login after signup**: after the admin proxy creates the user, `login()` is called automatically — the user never sees a separate "now log in" step.
- **Silent error swallowing in isTodayCook()**: the `catch` block returns `false` instead of throwing. This is intentional: the calling middleware (`cook.ts`) treats `false` as "not today's cook" and redirects to `/kitchen`. An HTTP or network error should not block navigation.
- **No server-side logout**: `logout()` only clears the client-side token cookie and user state. The Directus session itself is not invalidated — the token remains valid until its 24h TTL expires. This is acceptable because the frontend is the only client using this token.

## Cook Panel (`frontend/app/pages/cook.vue`)

A state-machine-driven page (6 states) that is the core workflow for the assigned cook. Guarded by `middleware/cook.ts` — only the user who has a non-cancelled `cook_queue` entry for today can access it. The state machine (`loading → assign → dish → scheduled → cooking → ready → done`) drives which UI sections render and which actions are available.

Key design decisions:
- **Fork-on-cook pattern**: when the cook picks an existing recipe owned by another user, `saveDish()` creates a fork (copy with `forked_from` pointer) owned by the current cook. On repeat cooking, the existing fork is reused. This keeps recipe ownership intact while letting each cook modify their version.
- **Auto-join on assign**: `assignAsCook()` creates a `confirmed` order for the cook immediately, so the cook appears in participants without a separate join step.
- **Cancel cleans up orders + shopping list**: `cancelCooking()` deletes all confirmed orders and calls `cleanupShoppingList()` to remove shopping list items linked to the recipe — the system stays consistent even if the meal never happened.
- **Visibility change sync**: a `document.visibilitychange` listener re-fetches queue entry status when the browser tab becomes visible, so the cook sees admin changes (e.g. if an admin cancels the entry) without manual refresh.
- **Past-date guard**: if the URL carries a past date, the page immediately redirects to `/kitchen` — the cook panel only works for today or future dates.
- **Receipt overdue badge**: after 14:00 on the same day, an overdue badge appears in the `ready` state to nudge the cook to enter the receipt.

## Deduction logic: useDeduction (`frontend/app/composables/useDeduction.ts`)

Extracted from `cook.vue` during refactoring. Handles the financial closure of a meal: computing per-person share (receipt + pasta add-on), triggering the admin-proxy server route that creates transactions and updates balances, and cleaning up shopping list items.

Key design decisions:
- **Admin-proxy for writes**: `confirmDeduction()` does not call Directus directly — it POSTs to a Nuxt server route (`/api/deduction/confirm`) that uses an admin Directus token. User-role tokens cannot write to other users' `balances` or `transactions` records. The proxy approach eliminated horizontal privilege escalation without requiring per-collection permission changes.
- **Pasta cost from two sources**: `loadPastaCost()` derives pasta package count from (1) the `ingredients` JSON array (entry named "pasta"), or (2) the `pasta_packages` field as fallback. This means the cost is accurate whether the cook typed "pasta" in ingredients or set the dedicated field.
- **Shopping list cleanup by two strategies**: `cleanupShoppingList()` tries recipe UUID first, then falls back to `dish_name + cook_date`. This covers both cases: linked recipes (precise) and dish-only entries that were never saved as recipes.
- **Best-effort cleanup**: shopping list deletion errors are silently caught — the deduction itself already succeeded. The cleanup is a convenience, not a consistency requirement.
- **Plain-object return**: the composable returns `{ deducting, pastaCost, ... }` (refs in a plain object). Callers in `<script setup>` must wrap with `reactive()` — Vue templates do not auto-unwrap refs nested inside plain objects.

## Participants: useParticipants (`frontend/app/composables/useParticipants.ts`)

Manages meal participant state — the list of confirmed orders for a cook_queue entry. Takes `cookQueueId` as a `Ref<string | null>` so it reactively updates when a queue entry is created.

Key design decisions:
- **Reactive queue ID**: the composable accepts a `Ref<string | null>`, not a plain string. This allows cook.vue to create the composable before the queue entry exists — when `assignAsCook()` creates the entry, the ref updates and subsequent `fetch()` calls pick it up.
- **Balance gate on join**: `join()` checks `useBalanceCheck()` before creating an order. If the user's balance is below -30 EUR, `joinBlockedReason` is set (not thrown) so the calling component can display it in `ActionBlockedModal`.
- **Plain-object return + reactive() requirement**: same pattern as `useDeduction`. The returned object contains raw refs that Vue templates cannot auto-unwrap. All callers must wrap with `reactive()`.

## Balance Gate: useBalanceCheck (`frontend/app/composables/useBalanceCheck.ts`)

A simple guard composable that checks whether a user's balance is above the -30 EUR threshold before allowing them to cook or join a meal. Called by `cook.vue.assignAsCook()` and `useParticipants.join()`.

Key design decisions:
- **Safe fallback on error**: if the Directus API call fails (network error, 500, etc.), `check()` returns `{ allowed: true, balance: 0 }`. A network glitch should never prevent a user from cooking or joining lunch.
- **No balance record = allowed**: users without a balance record (first-time users) get `balance: 0`, which is above the threshold. The balance record is only created on first deduction or admin top-up.
- **Exported MIN_BALANCE**: the constant is exposed in the return value so UI components can display the threshold without hardcoding it again.

## Meal Cost: useMealCost (`frontend/app/composables/useMealCost.ts`)

Handles cost calculations for meal add-ons, currently the pasta package price. The price is fetched from `app_settings` singleton via a Nuxt admin-proxy server route (not directly from Directus, because user tokens don't have read access on `app_settings`).

Key design decisions:
- **Admin-proxy for settings reads**: `fetchPastaPrice()` goes through `/api/settings/pasta-price` (Nuxt server route) rather than calling Directus directly. The `app_settings` singleton is admin-only; user tokens cannot read it.
- **Safe fallback price**: if the server route fails for any reason, `fetchPastaPrice()` returns `1.00` — the default configured in Directus. This prevents a total cost calculation failure due to an unreadable settings record.
- **Cached price**: `pastaPackagePrice` ref stores the last fetched value so `computePastaCost()` can be called multiple times without repeated network requests.

## Signup Proxy: `server/api/auth/signup.post.ts`

Nuxt server route that proxies user registration to the Directus Admin API. Directus does not expose user creation via its public API — only the Admin API can create users, so this server route bridges the gap.

Key design decisions:
- **Admin proxy pattern**: The frontend calls this Nuxt route, which in turn calls Directus `/users` with an admin Bearer token obtained by `server/utils/adminToken.ts`. This keeps admin credentials server-side only.
- **Server-side validation**: All validation (email format, password strength, name length, required fields) happens before the Directus API call. This provides clean error messages without exposing Directus internals and reduces unnecessary admin-token fetches for obviously invalid payloads.
- **IP-based rate limiting**: An in-memory `Map<string, number[]>` tracks request timestamps per IP (60-second sliding window, max 5). This is a lightweight DoS deterrent — acceptable for single-server, though it resets on restart and doesn't scale horizontally.
- **Duplicate email handling**: Directus returns a 400 with a uniqueness-violation message. The route forwards this verbatim to the client, so the frontend can display "email already exists" without having to parse Directus codes.
- **Directus role hardcoded**: The User role UUID (`1927ae8a-...`) is hardcoded. This is a tradeoff — avoids an extra lookup, but requires the UUID to stay in sync if the Directus role is ever recreated.
