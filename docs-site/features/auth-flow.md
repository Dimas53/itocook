# Auth Flow

## What It Does

Handles the full authentication lifecycle: user registration, login, logout, session restoration, and route protection. A user must authenticate before accessing any page except `/onboarding` and `/auth`.

## Collections Used

- **`directus_users`** (system collection) — stores user records.

## Files Involved

- `frontend/app/composables/useAuth.ts` — auth logic
- `frontend/app/composables/useDirectus.ts` — HTTP client with token management
- `frontend/server/api/auth/signup.post.ts` — admin-proxy server route
- `frontend/server/utils/adminToken.ts` — cached admin token
- `frontend/app/middleware/auth.global.ts` — global route guard
- `frontend/app/middleware/cook.ts` — cook-page-specific guard
- `frontend/app/pages/auth.vue` — login/registration UI

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
          ├── Success → store user → proceed
          └── Error (401/expired) → logout → redirect /auth
```

## Key Design Decisions

- **Admin-proxy for signup** — Admin credentials live only in `.env` (server-side).
- **Cookie-based token (not localStorage)** — Survives page reloads, accessible to SSR. Trade-off: `httpOnly: false`.
- **No token refresh** — 15-minute TTL; when expired, redirect to `/auth`.
- **isTodayCook() silent error handling** — Returns `false` on network errors instead of throwing.
- **No server-side logout** — Only clears client-side cookie; Directus session stays valid until 24h TTL.

## Edge Cases & Limitations

- **Token refresh not implemented** — Users logged out every ~15 min without active requests.
- **Rate limiting on signup** — 5 req / 60s per IP, in-memory sliding window.
- **Input validation on server** — Email regex, password 8+ chars with upper+lower+digit.
