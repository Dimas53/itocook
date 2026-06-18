# Auth Flow

## What It Does

Handles the full authentication lifecycle: user registration, login, logout, session restoration, and route protection. A user must authenticate before accessing any page except `/onboarding` and `/auth`.

## Collections Used

- **`directus_users`** (system collection) — stores user records created by the admin-proxy signup route.

## Files Involved

- `frontend/app/composables/useAuth.ts` — auth logic (login, signUp, logout, fetchUser, isTodayCook)
- `frontend/app/composables/useDirectus.ts` — HTTP client with token management
- `frontend/server/api/auth/signup.post.ts` — admin-proxy server route for user creation
- `frontend/server/utils/adminToken.ts` — cached admin token for proxy requests
- `frontend/server/utils/auth.ts` — `requireAuth` helper for server routes
- `frontend/app/middleware/auth.global.ts` — global route guard
- `frontend/app/middleware/cook.ts` — cook-page-specific guard
- `frontend/app/pages/auth.vue` — login/registration UI
- `frontend/app/pages/onboarding.vue` — post-registration onboarding

## Flow Diagram

```
User visits any page
    │
    ▼
auth.global.ts middleware
    │
    ├── No token cookie → redirect /auth
    │     ├── Login → POST /auth/login (Directus)
    │     │     └── Store access_token in cookie
    │     └── SignUp → POST /api/auth/signup (Nuxt server)
    │           ├── Server validates input
    │           ├── Server gets admin token via getAdminToken()
    │           ├── Server POSTs to Directus /users
    │           └── Auto-login after success
    │
    └── Has token → fetchUser() in useAuth
          ├── Success → store user in useState('auth:user') → proceed
          └── Error (401/token expired) → logout() → redirect /auth
```

## Key Design Decisions

**Admin-proxy for signup** — Directus requires admin privileges to create users. Calling Directus directly from the browser would expose the admin password in DevTools. Instead, the browser calls a Nuxt server route (`POST /api/auth/signup`) that proxies to Directus using a cached admin token. The admin credentials live only in `.env` (server-side).

**Cookie-based token (not localStorage)** — Cookies survive page reloads and are accessible to Nuxt SSR. `useCookie('directus_token')` persists the JWT across browser sessions. Trade-off: `httpOnly: false` because the client-side code needs to read the token to attach the `Authorization: Bearer` header to cross-origin Directus requests.

**No token refresh** — The access_token has a 15-minute TTL. When it expires, the next request returns 401, `fetchUser()` catches the error, and the middleware redirects to `/auth`. This is a known limitation. Refresh tokens are not implemented.

**isTodayCook() silent error handling** — Returns `false` on network errors instead of throwing. The cook middleware treats `false` as "not today's cook" and redirects to `/kitchen`. A network error should never block navigation.

**No server-side logout** — `logout()` only clears the client-side token cookie and user state. The Directus session remains valid until its 24h TTL. Acceptable because the frontend is the only client using this token.

## Edge Cases & Limitations

- **Token refresh not implemented** — users are logged out every ~15 min if no active requests keep the session alive.
- **Rate limiting on signup** — in-memory `Map<string, number[]>` tracks request timestamps per IP (max 5 req / 60s sliding window). Resets on server restart.
- **Input validation on server** — email regex, password 8+ chars with upper+lower+digit, name length 1-100. Validated before admin-token fetch to avoid unnecessary calls.
- **isTodayCook uses date+user filter** — queries `cook_queue` with `date == today AND cook == current_user AND status != cancelled`. Only non-cancelled entries count.
