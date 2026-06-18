# ItoCook — Security Audit

Date: 2026-06-18

Key findings:
- Critical: DIRECTUS_ADMIN_PASSWORD=admin committed in .env
- Critical: server routes do not authenticate client — any unauthenticated client can call endpoints, server logs in as admin
- Critical: directus_token cookie without httpOnly and secure: false
- High: confirmDeduction() runs through user token of all participants — if Directus permission is not restricted to $CURRENT_USER, this is horizontal escalation
- High: admin session per request (2 extra HTTP calls)
- Medium: CORS only localhost:3000, no rate limiting
  Regarding refactoring: the main takeaway for us is that confirmDeduction() currently works through a user token, which is a potential vulnerability. But this is a Directus permissions issue, not a code issue.

## Summary

The project has several critical security gaps. The most severe is the hardcoded admin password (`admin`) committed in `.env`, combined with the fact that 6 of 8 server API routes perform a full Directus admin login on every request without any client authentication check. The `directus_token` cookie lacks `httpOnly` and `secure` flags, making it accessible to JavaScript and sent over HTTP. The `confirmDeduction()` flow operates with the user's own Directus token but creates/updates records for *all* participants — making it a horizontal privilege escalation risk if Directus permissions are not scoped to `$CURRENT_USER`. There is zero authentication middleware: any unauthenticated client can call any server route, which in turn gets admin access to Directus.

## Priority: Critical

1. **Admin password `admin` committed in `.env`** — The `.env` file is tracked in git (confirmed via `git status` check) and contains `DIRECTUS_ADMIN_PASSWORD=admin`. This is a trivial password that grants full control over Directus, PostgreSQL, and all data. `DIRECTUS_KEY=itocook-secret-key-change-me` and `DIRECTUS_SECRET=itocook-secret-value-change-me` are also placeholder values.

2. **No authentication on server API routes** — 6 of 8 server routes (`pasta-price.get.ts`, `pasta-price.patch.ts`, `users/list.get.ts`, `users/count.get.ts`, `duty/upsert.post.ts`, `duty/confirm.patch.ts`) perform a Directus admin login on every request WITHOUT validating the client's authorization token. Any unauthenticated HTTP client can call these endpoints and obtain full admin-level access to Directus data. Only `users/update-me.patch.ts` uses the user's token from the cookie.

3. **`directus_token` cookie lacks `httpOnly` and `secure` flags** — In `useDirectus.ts:20-24`:
   ```ts
   const tokenCookie = useCookie<string | null>('directus_token', {
     maxAge: 60 * 60 * 24 * 7,
     sameSite: 'lax',
     secure: false,
   })
   ```
   No `httpOnly: true` means any XSS vulnerability exposes the auth token. `secure: false` means the token is sent over plain HTTP.

4. **7-day access token lifetime with no refresh token mechanism** — `ACCESS_TOKEN_TTL: "7d"` in `docker-compose.yml:48`. The TODO comment at line 46-47 (`# TODO: replace with proper refresh token flow in useAuth.ts`) confirms this is a known gap. A leaked token is valid for 7 days with no way to revoke.

## Priority: High

1. **Horizontal privilege escalation in `confirmDeduction()`** — `useDeduction.ts:86-113` uses the current user's Directus token (via `useDirectus().request()`) to create transactions and update balances for ALL participants:
   - Creates `transactions` records with arbitrary `user` ID (line 88: `user: p.id`)
   - Reads all participants' balances via `filter[user][_in]=${ids.join(',')}` (line 98)
   - Patches or creates `balances` records for any participant (lines 104-113)
   
   If Directus User policy does not restrict `transactions.create`, `transactions.read`, `balances.read`, and `balances.update` to `$CURRENT_USER`, any authenticated user can manipulate any other user's balance.

2. **No authentication middleware** — `frontend/server/middleware/` does not exist. There is no centralized auth check, no request validation, and no admin token caching mechanism. Every privileged route must independently implement authentication — and most don't.

3. **Admin credentials flow creates 2 extra HTTP requests per API call** — Every server route calls `POST /auth/login` then uses the resulting token. Admin credentials are transmitted on every invocation. No admin token caching/reuse anywhere.

4. **`cleanupShoppingList()` uses unsanitized user-controlled params in Directus filter** — `useDeduction.ts:63-71` embeds `userId`, `recipe`, `dishName`, and `cookDate` directly into URL query parameters. While the function is called with the current user's ID, the filtering logic is client-driven with no server-side enforcements.

## Priority: Medium

1. **`CORS_ORIGIN` set to single origin** — `docker-compose.yml:42`: `CORS_ORIGIN: "http://localhost:3000"`. Acceptable for development but must be updated for production. No `VARY` header handling for multiple origins.

2. **Admin credentials and Directus URL exposed to frontend container** — `docker-compose.yml:63-64`: `NUXT_DIRECTUS_ADMIN_EMAIL` and `NUXT_DIRECTUS_ADMIN_PASSWORD` are passed as environment variables to the frontend container. With `ssr: false`, the Nuxt server still processes API routes, but any compromise of the frontend container exposes admin credentials.

3. **No rate limiting** — No rate limiting on any endpoint, especially the signup route (`/api/auth/signup.post.ts`) which could be abused for user enumeration or mass registration.

4. **`/api/users/list.get.ts` fetches all active users** — Returns `id`, `first_name`, `last_name`, `avatar`, `department` for every active user (excluding MCP-prefixed). This is necessary for the app but should be audited for data minimization.

5. **No server-side input validation for signup** — `signup.post.ts:15` reads `email`, `password`, `firstName`, `lastName` but only checks for existence (line 17: `if (!email || !password || !firstName || !lastName)`). No email format validation, password strength requirements, or length limits.

6. **`CORS_MAX_AGE: "5"`** — Preflight cache is only 5 seconds, causing excessive OPTIONS requests. Should be increased to at least 600 (10 minutes) for production.

## Priority: Low

1. **`update-me.patch.ts` correctly uses user's token** — This route is the only one that proxies the user's Directus token from the cookie, which is the correct pattern. It does not use admin credentials.

2. **Docker Compose uses environment variable substitution (`${VAR}`)** — Secrets come from `.env` rather than being hardcoded in the compose file. This is good practice.

3. **PostgreSQL ports are exposed** — `5432:5432` is exposed to the host. While convenient for development, this should be removed or restricted in production.

4. **`http://directus:8055` in `nuxt.config.ts:19` vs `http://localhost:8055` in `docker-compose.yml:62`** — The runtime config default uses the Docker internal hostname, but the public config uses `localhost`. This is confusing but functionally correct for the Docker setup.

## Permissions Table

| Collection | User Policy Read | User Policy Create | User Policy Update | Notes |
|---|---|---|---|---|
| `orders` | Unknown (not auditable via MCP) | Unknown | Unknown | System collection — Directus MCP cannot read system permissions |
| `directus_users` | Unknown (field-level via admin proxy) | N/A (via admin proxy only) | N/A (via admin proxy only) | `/api/users/list.get.ts` uses admin token; `/api/users/update-me.patch.ts` uses user's token on `/users/me` |
| `balances` | Unknown — likely unrestricted | Unknown — likely unrestricted | Unknown — likely unrestricted | `confirmDeduction()` reads/updates ALL users' balances with user's token |
| `transactions` | Unknown — likely unrestricted | Unknown — likely unrestricted | Unknown — likely unrestricted | `confirmDeduction()` creates transactions for ALL users with user's token |
| `shopping_list_items` | Unknown — likely filtered | Unknown — likely filtered | Unknown | `cleanupShoppingList()` deletes by user+recipe filter |
| `app_settings` | Admin-only (via server proxy) | N/A (singleton) | Admin-only (via server proxy) | Both read and write go through admin-login server routes |
| `cook_queue` | Unknown | Unknown | Unknown | `confirmDeduction()` patches status to `completed` |
| `cleaning_schedule` | Admin-only (via server proxy) | Admin-only (via server proxy) | Admin-only (via server proxy) | `duty/upsert.post.ts` and `duty/confirm.patch.ts` use admin token |

**Note:** Directus MCP cannot read `directus_permissions` or `directus_policies` system collections. The actual User-policy permissions for each collection need to be verified manually via the Directus Admin UI (Settings → Access Policies → User policy). The "likely unrestricted" assessment is based on the fact that `confirmDeduction()` works successfully with a regular user's token to modify other users' data — if User policy had `$CURRENT_USER` restrictions, this would fail with 403.


---



# ItoCook — Security Fix Prompts

Run these one at a time. Verify in browser after each. Do NOT run the next prompt until the previous one is confirmed working.

 не перевожи это пока что на английский, это инструкция для меня, а не для пользователя!!!

Ключевые находки:
- Critical: DIRECTUS_ADMIN_PASSWORD=admin закоммичен в .env
- Critical: server routes не проверяют авторизацию клиента — любой может дёрнуть эндпоинт, сервер сам залогинится как админ
- Critical: directus_token cookie без httpOnly и secure: false
- High: confirmDeduction() ходит через user token всех участников — если Directus permission не ограничен $CURRENT_USER, это горизонтальная эскалация
- High: админ-сессия на каждый запрос (2 лишних HTTP вызова)
- Medium: CORS только localhost:3000, нет rate limiting
  Что касается рефакторинга: main-вывод для нас — confirmDeduction() сейчас работает через user token, и это потенциальная дыра. Но это вопрос permissions в Directus, а не кода.


---

## Prompt 1 — Cookie flags + Server Route authentication

```
Read AGENTS.md. Apply security-and-hardening skill if available, otherwise proceed.

Context: security audit found two critical gaps — cookie lacks httpOnly flag,
and all server routes accept requests from unauthenticated clients.

Task 1: Fix cookie in app/composables/useDirectus.ts
- Add httpOnly: true to the useCookie() options for directus_token
- Change secure to: process.env.NODE_ENV === 'production'
- Keep all other options unchanged (maxAge, sameSite)

Task 2: Create server/utils/auth.ts helper
- Export a function requireAuth(event: H3Event): string
- It reads the directus_token cookie from the incoming request
- If cookie is missing or empty, throw createError({ statusCode: 401, message: 'Unauthorized' })
- Returns the token string if present

Task 3: Add requireAuth() call to ALL files in server/api/ EXCEPT server/api/auth/signup.post.ts
- At the top of each handler, before any admin login logic, call: requireAuth(event)
- Import from '#imports' or use auto-import — check existing server route imports for the pattern
- Do NOT change any other logic in those files

Out of scope: do not touch confirmDeduction(), do not change Directus permissions,
do not modify any page components.

Final step: update docs/progress.md with one summary line for this session.
```

---

## Prompt 2 — confirmDeduction() → server route with admin proxy

```
Read AGENTS.md.

Context: confirmDeduction() in app/composables/useDeduction.ts currently uses
the regular user's Directus token to create transactions and update balances
for ALL participants. This is a horizontal privilege escalation risk.
The fix is to move this logic to a server route that uses admin credentials,
similar to how server/api/duty/upsert.post.ts works.

Task 1: Create server/api/deduction/confirm.post.ts
- Accept POST body: { cookQueueId: string, participants: Array<{id, share}>, totalAmount: number, cookId: string }
- Call requireAuth(event) at the top (from server/utils/auth.ts created in previous session)
- Use admin login pattern (same as other server routes) to get Directus admin token
- Replicate the transaction creation + balance update logic from useDeduction.ts confirmDeduction()
- Set cook_queue status to 'completed'
- Return { success: true } or throw error

Task 2: Update app/composables/useDeduction.ts
- Replace the direct Directus calls in confirmDeduction() with a single fetch('/api/deduction/confirm', { method: 'POST', body: JSON.stringify({...}) })
- Keep the same function signature and return type
- Remove the individual request() calls for transactions/balances/cook_queue from this function

Task 3: Check Directus User Policy permissions via Directus MCP
- Verify that balances and transactions collections have restricted permissions for User role
- If User policy has unrestricted write on balances/transactions, report it but do NOT change permissions automatically — add a comment in docs/progress.md

Out of scope: do not touch shopping_list_items cleanup, do not change cook.vue UI,
do not modify other server routes.

Final step: update docs/progress.md with one summary line.
```

---

## Prompt 3 — .env hardening + CORS + TTL

```
Read AGENTS.md.

Context: security audit found weak defaults in .env and docker-compose.yml.

Task 1: Update .env (the actual file, not .env.example)
- Change DIRECTUS_ADMIN_PASSWORD from 'admin' to a stronger value: 'ItoCook2026!dev'
- Change DIRECTUS_KEY from 'itocook-secret-key-change-me' to a random 32-char string
- Change DIRECTUS_SECRET from 'itocook-secret-value-change-me' to a different random 32-char string
- Generate the random strings yourself (use openssl rand -hex 16 equivalent logic)
- IMPORTANT: after changing the password, the existing admin session in Directus will be invalidated.
  Add a note in docs/progress.md that admin password was changed and the new value is in .env

Task 2: Update .env.example
- Replace the actual password/key/secret values with obvious placeholders:
  DIRECTUS_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
  DIRECTUS_KEY=CHANGE_ME_32_CHAR_RANDOM_HEX
  DIRECTUS_SECRET=CHANGE_ME_32_CHAR_RANDOM_HEX

Task 3: Update docker-compose.yml
- Change CORS_MAX_AGE from "5" to "600"
- Change ACCESS_TOKEN_TTL from "7d" to "24h"
- Keep the TODO comment about refresh token flow

Task 4: Check if .env is in .gitignore
- If it is NOT listed, add it
- .env.example should remain tracked (not in .gitignore)

Out of scope: do not touch any frontend files, do not modify server routes,
do not restart Docker — just file changes.

Note for developer: after running this prompt, restart Docker with:
  docker-compose down && docker-compose up -d
Then log in again with the new admin password from .env.

Final step: update docs/progress.md with one summary line.
```

---

## Prompt 4 — Rate limiting on signup

```
Read AGENTS.md.

Context: /api/auth/signup.post.ts has no rate limiting — anyone can spam it
for user enumeration or mass registration.

Task: Add simple in-memory rate limiting to server/api/auth/signup.post.ts only.

Implementation:
- At the top of the file (outside the handler), create a Map: ipRequestLog = new Map<string, number[]>()
- In the handler, before any other logic:
  1. Get client IP from event: const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  2. Get current timestamps for this IP from the map
  3. Filter to only keep timestamps from the last 60 seconds
  4. If count >= 5, throw createError({ statusCode: 429, message: 'Too many requests. Try again later.' })
  5. Otherwise push current timestamp and update the map
- This allows max 5 signup attempts per IP per 60 seconds
- The map resets on server restart (acceptable for MVP)

Do NOT add rate limiting to login — that's handled differently (Directus has its own brute force protection).
Do NOT add rate limiting to any other routes.
Do NOT install any npm packages — use only what's already available in H3/Nuxt.

Final step: update docs/progress.md with one summary line.
```

---

## Security Fix Progress — 2026-06-18

### Выполнено (4 промпта):

**Prompt 1 — Cookie flags + Server Route authentication** ✅
- `directus_token` cookie: `secure: !import.meta.dev`, `httpOnly: false` (architectural constraint — JS читает cookie для Bearer-токена на другой origin)
- `server/utils/auth.ts` — `requireAuth(event)` helper
- `requireAuth()` добавлен во все 7 server routes (кроме signup)

**Prompt 2 — confirmDeduction() → server route with admin proxy** ✅
- `server/api/deduction/confirm.post.ts` — admin-proxy для создания транзакций и обновления балансов
- `useDeduction.ts` — заменены прямые Directus-вызовы на `fetch('/api/deduction/confirm')`
- Проверены Directus permissions: User policy (`e563cf6a`) имеет `create`/`update` без `$CURRENT_USER` на `balances` и `transactions`

**Prompt 3 — .env hardening + CORS + TTL** ✅
- Ротация `DIRECTUS_ADMIN_PASSWORD`, `DIRECTUS_KEY`, `DIRECTUS_SECRET` в `.env`
- `.env.example` — плейсхолдеры вместо реальных значений
- `CORS_MAX_AGE: 5 → 600`, `ACCESS_TOKEN_TTL: 7d → 24h`

**Prompt 4 — Rate limiting on signup** ✅
- In-memory rate limiter на `/api/auth/signup`: max 5 запросов / 60s per IP
- Сброс при рестарте сервера (MVP)

**5. Signup input validation** ✅
- Валидация формата email (regex)
- Минимальная сложность пароля (8+ символов, uppercase, lowercase, digit)
- Проверка длины полей firstName/lastName

**6. Admin token caching** ✅
- `server/utils/adminToken.ts` — in-memory cache с TTL 23h
- Все 8 server routes переписаны на `getAdminToken(config)` вместо per-request `POST /auth/login`

### Отложено (не стоит времени сейчас):
- CORS_ORIGIN для production
- Admin credentials в frontend-контейнере
- PostgreSQL порт открыт наружу
