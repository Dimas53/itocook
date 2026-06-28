# Security Audit — 2026-06-28

## Methodology

Audited 4 layers:
1. Nuxt server routes (11 handlers)
2. Directus access policies (User role `e563cf6a`)
3. nginx reverse proxy configuration
4. Auth edge cases (rate limiting, validation, error messages)

---

## 1. Directus Permissions — Findings

### CRITICAL: User role can read ALL `directus_users` fields ✅ Fixed 2026-06-28

The User policy `e563cf6a` has:
```
read | directus_users | fields=['*'] | perm=None
```

This exposes every field on every user — including `email`, `role`, `tfa_secret`, `token`, and `password` (hashed). A separate, more restrictive rule `read | directus_users | fields=['id','first_name','last_name','avatar','department']` exists but Directus merges permissions as UNION, so the broader rule wins.

**Fix:** Remove the unrestricted read rule (`fields=['*'], perm=None`). Keep only the scoped rule. The Nuxt server proxies (`users/list.get.ts`, `users/count.get.ts`) use admin tokens and are unaffected.

**Status:** ✅ Fixed — wildcard rule (`id: 2`) deleted from `directus_permissions`. Only scoped rule (`id: 66`, fields=`id,first_name,last_name,avatar,department`) remains. Verified Home and Kitchen screens show user names correctly.

### CRITICAL: `balances` — create/update unrestricted

```
create | balances | fields=['*'] | perm={}
update | balances | fields=['*'] | perm={}
```

Any authenticated user can create or update any balance record. The `deduction/confirm.post.ts` server route proxies through the admin token (safe), but direct API calls from the frontend bypass server-side authorization.

**Fix:** Remove `create` and `update` from the User policy for `balances`. The only write path should be through `deduction/confirm.post.ts` (admin-proxied).

### CRITICAL: `transactions` — create unrestricted

```
create | transactions | fields=['*'] | perm={}
```

Any authenticated user can create transactions for any other user.

**Fix:** Remove `create` on `transactions` from the User policy. Route all writes through the admin-proxied `deduction/confirm.post.ts`.

### HIGH: `cook_queue` — update unrestricted ✅ Fixed 2026-06-28

```
update | cook_queue | fields=['*'] | perm={}
```

Any user can update any queue entry's status.

**Fix:** Restrict with `{'user_created': {'_eq': '$CURRENT_USER'}}` or remove from User policy (writes go through admin-proxied server routes).

**Status:** ✅ Fixed — permission `id: 39` updated: `permissions` changed from `{}` to `{'user_created': {'_eq': '$CURRENT_USER'}}`. Verified saveDish and startCooking work (200) as own-user. Browser console: no 403 errors.

### HIGH: `orders` — update/delete unrestricted

```
update | orders | fields=['*'] | perm=None
delete | orders | fields=['*'] | perm=None
```

**Fix:** Restrict with `{'user_created': {'_eq': '$CURRENT_USER'}}`.

### LOW: `recipes` — update fields includes `pasta_packages`

The `pasta_packages` field is in the update field list. Verify that this field should be user-editable.

---

## 2. Nuxt Server Routes

### Positive: All protected routes call `requireAuth(event)`

| Route | requireAuth | Admin Token |
|---|---|---|
| `auth/signup.post.ts` | ❌ (intentional — public) | ✅ |
| `deduction/confirm.post.ts` | ✅ | ✅ |
| `duty/upsert.post.ts` | ✅ | ✅ |
| `duty/confirm.patch.ts` | ✅ | ✅ |
| `notifications/read.patch.ts` | ✅ | ✅ |
| `users/count.get.ts` | ✅ | ✅ |
| `users/list.get.ts` | ✅ | ✅ |
| `users/update-me.patch.ts` | ✅ | ❌ (user token proxied) |
| `settings/pasta-price.get.ts` | ✅ | ✅ |
| `settings/pasta-price.patch.ts` | ✅ | ✅ |
| `push/vapid-key.get.ts` | ❌ (intentional — public) | ❌ |

### `users/update-me.patch.ts` uses user token correctly

Uses `getCookie(event, 'directus_token')` to proxy the user's own token instead of the admin token — correct, ensures users can only update their own profile. But it accepts the entire request body without field validation — any field in `directus_users` could be patched (role, email, etc.).

**Fix:** Whitelist allowed fields (e.g., first_name, last_name, avatar, department).

### `deduction/confirm.post.ts` uses `useRuntimeConfig()` correctly

No `event` argument needed. (Nuxt 4: `useRuntimeConfig()` without event works in server routes when called synchronously.)

### `signup.post.ts` — rate limiting is in-memory

The IP-based rate limiter uses a `Map<string, number[]>` in server memory. Reset on restart. Acceptable for single-server deployment but does not survive restarts.

---

## 3. nginx Configuration

### Missing security headers (all locations)

```
# Add to all proxy locations:
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "0" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Missing Content Security Policy header

No CSP is set. This leaves the site vulnerable to XSS and data injection. A minimal CSP:
```
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' http://localhost:*; frame-ancestors 'none';" always;
```

### HTTP → HTTPS redirect for `/api/send-push`

The `/api/send-push` location is only defined in the HTTPS block. If a user sends a POST to `http://itocook.duckdns.org/api/send-push`, the server will serve a 301 redirect but the POST body may be lost on redirect (depending on client).

**Mitigation:** Acceptable for production since the site only serves over HTTPS and the 301 redirect is standard. Minor risk for clients that don't follow redirects with POST.

### No rate limiting per upstream

No `limit_req_zone` directives. The signup route has its own rate limiter, but other endpoints (login, API) are not rate-limited at the reverse proxy level.

---

## 4. Auth Edge Cases

### Password validation on signup (server-side)

```
8+ chars, uppercase, lowercase, digit
```

This check runs on the Nuxt server route. No client-side duplicate check exists — acceptable.

### Error messages do not leak sensitive info

All server routes return generic error messages (`Failed to create transaction`, `Failed to update balance`) with the Directus error message appended only on failure. However, Directus error messages may leak schema details (field names, foreign key constraints).

**Recommendation:** Log the full Directus error server-side and return a sanitized message to the client.

### Token validation is read-before-write

`middleware/auth.global.ts` fetches `/users/me` on every route transition to validate the token. This adds latency on every navigation but prevents stale sessions.

### `isTodayCook()` silently returns `false` on error

Intentional: the cook guard middleware redirects users who are not the cook. Fail-closed behavior.

### No CSRF protection

The Nuxt server routes accept POST/PATCH requests without CSRF tokens. Since the auth cookie is `directus_token` (not an HttpOnly session cookie), CSRF via cookie-jar is less of a concern — the token must be explicitly read from cookie and set as a Bearer header. However, Nuxt routes that accept user tokens via cookie (`requireAuth` reads `directus_token` from cookie) could theoretically be exploited if an XSS vulnerability allows reading the cookie.

**Recommendation:** Add `SameSite=Lax` or `SameSite=Strict` to the `directus_token` cookie.

---

## Summary

| Severity | Issue | File / Location |
|---|---|---|
| CRITICAL | `directus_users` has unrestricted read (all fields) | Directus User policy | ✅ Fixed
| CRITICAL | `balances` create/update without restrictions | Directus User policy |
| CRITICAL | `transactions` create without restrictions | Directus User policy |
| HIGH | `cook_queue` update without restrictions | Directus User policy | ✅ Fixed
| HIGH | `orders` update/delete without restriction | Directus User policy |
| MEDIUM | `update-me.patch.ts` accepts unrestricted body fields | `server/api/users/update-me.patch.ts` | ✅ Fixed
| MEDIUM | Missing CSP in nginx | `docs/nginx-itocook.conf` |
| LOW | Missing security headers in nginx | `docs/nginx-itocook.conf` |
| LOW | `pasta_packages` in recipe update field list | Directus User policy |

---

## Risk Assessment — 2026-06-28

### CRITICAL: `directus_users` unrestricted read

**Frontend direct calls to `/users` or `/directus_users`:** 0

All user-list reads go through Nuxt admin-proxy server routes (`/api/users/list`, `/api/users/count`). The frontend has zero direct calls to `/users` or `/directus_users` via `useDirectus()`. Only the two admin-proxy routes use the Directus `/users` endpoint, and they use the admin token (unaffected by User policy).

- **Risk if permission removed RIGHT NOW:** 🟢 **Safe** — nothing breaks
- **Recommended action:** Remove the wildcard rule (`fields=['*'], perm=None, action=read`) from the User policy. Keep only the scoped rule (`fields=['id','first_name','last_name','avatar','department'], perm={}`). The scoped rule already exists.

### CRITICAL: `balances` create/update unrestricted

**Frontend direct writes to `/items/balances` via `useDirectus()`:**

| File | Line | Operation | Action |
|---|---|---|---|
| `finance.vue` | 179 | PATCH `/items/balances/${record.id}` | Update existing balance (top-up) |
| `finance.vue` | 183 | POST `/items/balances` | Create new balance (top-up, first time) |

**Admin-proxied writes (safe):** `deduction/confirm.post.ts` — uses admin token.

All other pages/composables only READ balances (`GET` via `BalanceWidget.vue`, `useBalanceCheck.ts`, `profile.vue`).

- **Risk if create/update removed RIGHT NOW:** 🟡 **Needs work first** — the manual top-up flow in `finance.vue` would break
- **Recommended action:** Move manual top-up to an admin-proxy server route (create `PUT /api/finance/topup`), then remove `create` and `update` from the User policy for `balances`. The deduction path already goes through the admin proxy and is safe.

### CRITICAL: `transactions` create unrestricted

**Frontend direct writes to `/items/transactions` via `useDirectus()`:**

| File | Line | Operation | Action |
|---|---|---|---|
| `finance.vue` | 164 | POST `/items/transactions` | Create credit/debit transaction (top-up) |

**Admin-proxied writes (safe):** `deduction/confirm.post.ts` — creates debit transactions for all participants via admin token.

- **Risk if `create` removed RIGHT NOW:** 🟡 **Needs work first** — the manual top-up flow in `finance.vue` would break
- **Recommended action:** Include transaction creation in the same admin-proxy route as the balance top-up (`PUT /api/finance/topup`), then remove `create` from the User policy for `transactions`.

### HIGH: `cook_queue` update unrestricted ✅ Fixed 2026-06-28

**Frontend direct PATCH calls to `/items/cook_queue` via `useDirectus()`:**

| File | Line | Action | Own entry? |
|---|---|---|---|
| `cook.vue` | 848 | PATCH `saveDish()` — set dish_name + category + status | ✅ yes — user created it |
| `cook.vue` | 878 | PATCH `markReady()` — set status=ready | ✅ yes — user created it |
| `cook.vue` | 919 | PATCH `cancelCooking()` — set status=cancelled | ✅ yes — user created it |
| `cook.vue` | 975 | PATCH `startCooking()` — set status=cooking | ✅ yes — user created it |
| `cook.vue` | 1002 | PATCH status update | ✅ yes — user created it |
| `recipe/[id].vue` | 819 | PATCH `startCooking()` — set status=cooking | ✅ yes — user created it |
| `recipe/[id].vue` | 835 | PATCH `markReady()` — set status=ready | ✅ yes — user created it |

All 7 PATCH calls operate on the current user's own `cook_queue` entry. No cross-user writes to `cook_queue` exist in the frontend.

- **Risk if restricted to `user_created = $CURRENT_USER`:** 🟢 **Safe** — no direct writes would break
- **Recommended action:** Add `{'user_created': {'_eq': '$CURRENT_USER'}}` filter on `update` action for `cook_queue`.

**Status:** ✅ Fixed — permission `id: 39` updated. Verified saveDish and startCooking work (200) as own-user. No 403 errors in browser console.

### HIGH: `orders` update/delete unrestricted

**Frontend direct write calls to `/items/orders` via `useDirectus()`:**

| File | Line | Action | Own entry? |
|---|---|---|---|
| `cook.vue` | 782 | POST `assignAsCook()` — create order for self | ✅ own order |
| `cook.vue` | 1007–1010 | GET + DELETE all orders for queue entry (cancel flow) | ❌ **deletes OTHER users' orders** |
| `profile.vue` | 560 | DELETE `leaveMeal()` — delete own order | ✅ own order |
| `profile.vue` | 571–574 | DELETE orders by queue ID + user ID | ✅ own order |
| `useParticipants.ts` | 115 | POST `join()` — create order for self | ✅ own order |

**The cancel flow (`cook.vue:1007-1010`) is the blocker.** When a cook cancels a meal, it lists ALL confirmed orders for that cook_queue entry and DELETES each one — regardless of which user owns the order. If DELETE is restricted to `$CURRENT_USER`, the cancel flow would get 403 Forbidden on every order that belongs to another participant.

- **Risk if restricted to `user_created = $CURRENT_USER`:** 🔴 **Will break** — cancel flow deletes other users' orders
- **Recommended action:** Move the cancel DELETE logic to an admin-proxy server route (create `POST /api/orders/cancel` that takes a `cookQueueId` and deletes all related orders with the admin token), then restrict DELETE with `{'user_created': {'_eq': '$CURRENT_USER'}}`.

### MEDIUM: `update-me.patch.ts` unrestricted body ✅ Fixed 2026-06-28

**Frontend fields sent to `/api/users/update-me`:**

| File | Line | Sent body |
|---|---|---|
| `profile.vue` | 353 | `{ avatar: uploaded.id }` |
| `profile.vue` | 586 | `{ department: value || null }` |

Only two fields are sent: `avatar` and `department`. Both are safe. However, the server route accepts the entire request body without whitelisting.

**Exploitability:** The route proxies to Directus `/users/me` PATCH using the user's own token. Even if a malicious payload included `role`, `email`, or `password`, the Directus User policy restricts `update` on `directus_users` to `fields=['avatar']` with `perm={'id': {'_eq': '$CURRENT_USER'}}`. Directus itself would reject any field outside `avatar`.

**Defense-in-depth issue:** If the Directus User policy were ever broadened (e.g., to allow users to update their own email), the Nuxt route would silently pass through any field without a whitelist.

- **Risk if NOT fixed:** 🟢 **Low** — Directus permission layer blocks exploits; defense-in-depth gap only
- **Recommended action:** Add a field whitelist to `update-me.patch.ts`:
  ```ts
  const allowed = ['first_name', 'last_name', 'avatar', 'department']
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )
  ```

**Status:** ✅ Fixed — field whitelist added to `update-me.patch.ts`. Verified department save works (PATCH 200). No errors in browser console.


---
Отличный анализ — агент сделал именно то что нужно. Теперь картина чёткая.
Что я бы сделал прямо сейчас — только два зелёных:

directus_users wildcard → удалить. 0 рисков, 0 сломанного, критическая уязвимость.
cook_queue → добавить $CURRENT_USER фильтр. Все 7 вызовов свои, ничего не сломается.

Это 10 минут работы и закрывает 2 критических + 1 high.

---

Что отложить — остальное требует сначала создать server routes:

balances + transactions → нужен /api/finance/topup сначала
orders cancel → нужен /api/orders/cancel сначала
update-me whitelist → низкий риск, можно в любой момент

Эти три лучше сделать отдельной сессией с полным фокусом — там реальный код писать надо, не просто permissions менять.
Промпт для быстрого фикса прямо сейчас:
Fix only the two SAFE items from docs/audits/security-audit.md
risk assessment. Do NOT touch anything else.

1. directus_users — remove the wildcard read rule (fields=['*'],
   perm=None) from User policy via Directus MCP.
   Keep only the scoped rule that already exists.

2. cook_queue — add filter {'user_created': {'_eq': '$CURRENT_USER'}}
   to the update action in User policy via Directus MCP.

After each change — verify in Directus that the rule looks correct.
Test: open the app in browser, do a cook flow, confirm nothing breaks.

Update docs/audits/security-audit.md — mark these two as ✅ Fixed.
Do NOT touch balances, transactions, orders, or update-me.patch.ts.