# Spec: Phase 2 — Auth Backend

## Objective

Replace fake login with real Directus authentication. Token saved in cookie, user session persisted across reloads, route guard checks live token. Registration via admin proxy (no client-side admin credentials).

## Tech Stack

- Nuxt 4 server routes (`frontend/server/`)
- Directus SDK via `useDirectus` composable (fetch-based, no SDK package)
- Cookie-based token storage (`directus_token`)
- TypeScript strict

## Commands

```bash
# Dev (requires Directus running)
docker compose up -d directus
cd frontend && npm run dev
```

## Project Structure

```
frontend/
├── app/
│   ├── composables/
│   │   ├── useDirectus.ts      # HTTP client, token management
│   │   └── useAuth.ts          # login, signUp, logout, fetchUser, isTodayCook
│   └── middleware/
│       └── auth.ts             # Route guard — redirect to /auth
└── server/
    ├── api/auth/
    │   └── signup.post.ts      # Admin proxy — creates user via Directus admin API
    └── utils/
        ├── adminToken.ts       # Cached admin token for server routes
        └── auth.ts             # requireAuth helper for server routes
```

## Code Style

```typescript
// useDirectus — single composable for all API calls
const token = useCookie('directus_token')
const headers = { Authorization: `Bearer ${token.value}` }
const res = await fetch(`${base}/items/collection`, { headers })
```

## Testing Strategy

Manual — verify login flow in browser, check cookie set, confirm redirect.

## Boundaries

- **Always:** Call `useDirectus` at composable init, not inside async handlers (Nuxt context)
- **Ask first:** Changing auth strategy, adding oAuth, modifying cookie settings
- **Never:** Expose admin credentials to client, store tokens in localStorage

## Key Gotchas

- `useDirectus()` at composable top level only — `useRuntimeConfig`, `useCookie` need synchronous Nuxt context
- DELETE 204: `res.json()` throws on empty body → use `res.text()` + conditional `JSON.parse`
- Token expiry: middleware must catch 401 and redirect to `/auth`
- Server proxy gets admin token fresh each call — never cached across requests

## Success Criteria

1. Login with real Directus credentials sets `directus_token` cookie
2. Page reload keeps user logged in
3. Unauthenticated users redirect to `/auth`
4. Registration creates user with User role (via server proxy)
5. Dynamic redirect: `/cook` if today's cook, `/` otherwise
