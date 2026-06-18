# System Overview

## Architecture at a Glance

```
 Browser (localhost:3000)
       │
       ├── Nuxt Client (Vue SPA)
       │     └── composables/ → useDirectus (HTTP client)
       │           └── Authorization: Bearer <token>
       │
       ├── Nuxt Server (SSR + API routes)
       │     └── server/api/* — admin-proxy routes
       │           └── getAdminToken() → admin Directus session
       │
       └── Directus (localhost:8055)
             └── PostgreSQL (localhost:5432)
```

## Docker Network Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Network                         │
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   postgres   │◄────│   directus   │◄── browser       │
│  │   port 5432  │     │   port 8055  │    localhost:8055│
│  └──────────────┘     └──────────────┘                  │
│                              ▲                          │
│                              │ http://directus:8055      │
│                       ┌──────────────┐                  │
│                       │   frontend   │◄── browser       │
│                       │   port 3000  │    localhost:3000 │
│                       └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

1. **Directus as API layer, not just CMS** — auto-generates REST endpoints from collection definitions, provides RBAC and JWT auth out of the box.

2. **Admin-proxy pattern** — all privileged operations go through Nuxt server routes that proxy to Directus with an admin Bearer token. Admin credentials never reach the browser.

3. **Cookie-based token storage** — `directus_token` cookie survives page reloads and works with SSR. Trade-off: `httpOnly: false` required because the client needs to attach the token to cross-origin requests.

4. **No Directus SDK** — custom `useDirectus` composable wrapping native `fetch`. Single point of change for all API communication.

5. **State machine in cook panel** — the `/cook` page implements a 6-state machine (`loading → assign → dish → scheduled → cooking → ready → done`).

6. **Fork-on-cook** — when a cook selects another user's recipe, the system creates a copy (fork) owned by the cook.

7. **In-memory caching for admin token** — 23-hour TTL, reset on server restart.

## Collections Overview

| Collection | Purpose | Key Relations |
|---|---|---|
| `cook_queue` | Cooking assignments | M2O → users, M2O → recipes |
| `orders` | Meal participation | M2O → users, M2O → cook_queue |
| `recipes` | Dish definitions | M2O → users, self-ref (forked_from) |
| `recipe_likes` | Recipe likes (junction) | M2O → recipes, M2O → users |
| `balances` | Per-user financial accounts | M2O → users |
| `transactions` | Financial records | M2O → users |
| `shopping_list_items` | User shopping lists | M2O → users, M2O → recipes |
| `cleaning_schedule` | Duty roster | M2O → users |
| `app_settings` | Global constants (singleton) | — |

## Feature Docs

| Feature | Document |
|---|---|
| Auth | [architecture/auth-flow.md](/features/auth-flow) |
| Cook Queue | [architecture/cook-queue.md](/features/cook-queue) |
| Finance | [architecture/finance.md](/features/finance) |
| Recipe System | [architecture/recipe-system.md](/features/recipe-system) |
| Shopping List | [architecture/shopping-list.md](/features/shopping-list) |
| Duty | [architecture/duty.md](/features/duty) |
