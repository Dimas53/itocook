# Security Audit — 2026-06-28

## Methodology

Audited 4 layers:
1. Nuxt server routes (11 handlers)
2. Directus access policies (User role `e563cf6a`)
3. nginx reverse proxy configuration
4. Auth edge cases (rate limiting, validation, error messages)

---

## 1. Directus Permissions — Findings

### CRITICAL: User role can read ALL `directus_users` fields

The User policy `e563cf6a` has:
```
read | directus_users | fields=['*'] | perm=None
```

This exposes every field on every user — including `email`, `role`, `tfa_secret`, `token`, and `password` (hashed). A separate, more restrictive rule `read | directus_users | fields=['id','first_name','last_name','avatar','department']` exists but Directus merges permissions as UNION, so the broader rule wins.

**Fix:** Remove the unrestricted read rule (`fields=['*'], perm=None`). Keep only the scoped rule. The Nuxt server proxies (`users/list.get.ts`, `users/count.get.ts`) use admin tokens and are unaffected.

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

### HIGH: `cook_queue` — update unrestricted

```
update | cook_queue | fields=['*'] | perm={}
```

Any user can update any queue entry's status.

**Fix:** Restrict with `{'user_created': {'_eq': '$CURRENT_USER'}}` or remove from User policy (writes go through admin-proxied server routes).

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
| CRITICAL | `directus_users` has unrestricted read (all fields) | Directus User policy |
| CRITICAL | `balances` create/update without restrictions | Directus User policy |
| CRITICAL | `transactions` create without restrictions | Directus User policy |
| HIGH | `cook_queue` update without restrictions | Directus User policy |
| HIGH | `orders` update/delete without restriction | Directus User policy |
| MEDIUM | `update-me.patch.ts` accepts unrestricted body fields | `server/api/users/update-me.patch.ts` |
| MEDIUM | Missing CSP in nginx | `docs/nginx-itocook.conf` |
| LOW | Missing security headers in nginx | `docs/nginx-itocook.conf` |
| LOW | `pasta_packages` in recipe update field list | Directus User policy |
