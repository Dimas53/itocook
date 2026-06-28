# Phase 2: First Live Flow

## Goal
Login works with a real Directus backend, token is saved, basic user session is pulled from the server.

## Completed
- `useDirectus` composable — wraps `fetch` for all Directus API communication; manages `directus_token` cookie, attaches `Authorization: Bearer` header
- `useAuth` rewritten — real POST to Directus `/auth/login`, saves token in cookie
- `useAuth.signUp` — registration via Nuxt server proxy (admin API), User role auto-assigned
- Global middleware (`auth.global.ts`) — checks live token via `/users/me`, redirects to `/auth` if invalid
- Form validation — email regex, password 8+ chars with upper+lower+digit, name length 1-100
- Password toggle (show/hide) on auth form
- Dynamic redirect after login: if user is today's cook → `/cook`, otherwise → `/`
- Signup rate limiting — in-memory limiter (max 5 req / 60s per IP)

## Key decisions
- Admin-proxy pattern for signup (frontend never exposes admin credentials)
- Cookie-based token storage (`directus_token`) for SSR compatibility
- `fetch`-based Directus client instead of `@directus/sdk` (lighter, more control)
- Nuxt server routes (`server/api/`) for all admin-privileged operations

## Key files created/modified
- `frontend/app/composables/useDirectus.ts`, `useAuth.ts`
- `frontend/app/middleware/auth.global.ts`
- `frontend/server/api/auth/signup.post.ts`
- `frontend/server/utils/auth.ts` (requireAuth)

## Status
DONE ✅ — 2026-06-03
