# System Overview

## Architecture at a Glance

```
 Browser (itocook.duckdns.org)
        │
        ├── Nuxt Client (Vue SPA)
        │     └── composables/ → useDirectus (HTTP client)
        │           └── Authorization: Bearer <token>
        │
        ├── Nuxt Server (SSR + API routes)
        │     └── server/api/* — admin-proxy routes
        │           └── getAdminToken() → admin Directus session
        │
        ├── Directus (port 8055)
        │     └── PostgreSQL (port 5432)
        │
        └── FastAPI (port 8000)
              └── /api/send-push → pywebpush → Browser Push Service
```

## Docker Network Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Docker Network                                │
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │   postgres   │◄────│   directus   │◄───│    nginx (host)       │ │
│  │   port 5432  │     │   port 8055  │    │ itocook.duckdns.org   │ │
│  └──────────────┘     └──────────────┘    │                        │ │
│                            ▲               │  /cms/* → directus    │ │
│                            │               │  /api/* → nuxt        │ │
│                     ┌──────────────┐       │  /api/send-push → api │ │
│                     │   frontend   │       │  /* → nuxt             │ │
│                     │   port 3000  │       └──────────────────────┘ │
│                     └──────────────┘                                 │
│                            ▲                                         │
│                     ┌──────────────┐                                 │
│                     │     api      │                                 │
│                     │   port 8000  │                                 │
│                     │  (FastAPI)   │                                 │
│                     └──────────────┘                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

1. **Directus as API layer, not just CMS** — auto-generates REST endpoints from collection definitions, provides RBAC and JWT auth out of the box.

2. **Admin-proxy pattern** — all privileged operations go through Nuxt server routes that proxy to Directus with an admin Bearer token. Admin credentials never reach the browser.

3. **Cookie-based token storage** — `directus_token` cookie survives page reloads and works with SSR. Trade-off: `httpOnly: false` required because the client needs to attach the token to cross-origin requests.

4. **No Directus SDK** — custom `useDirectus` composable wrapping native `fetch`. Single point of change for all API communication.

5. **State machine in cook panel** — the `/cook` page implements a 6-state machine (`loading → assign → dish → scheduled → cooking → ready → done`).

6. **Fork-on-cook** — when a cook selects another user's recipe, the system creates a copy (fork) owned by the cook.

7. **In-memory caching for admin token** — 23-hour TTL, reset on server restart.

8. **FastAPI microservice for push** — dedicated Python service for push notification delivery, separate from the main Nuxt/Directus stack.

9. **generateSW over injectManifest** — `@vite-pwa/nuxt` with `generateSW` strategy to avoid build conflicts in Nuxt 4's `app/public/` directory.

10. **Polling over WebSocket for notifications** — `useNotifications` polls every 20s. WebSocket adds complexity not justified by current scale.

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
| `notifications` | In-app notifications | M2O → users |
| `push_subscriptions` | Browser push subscriptions | M2O → users |
| `company_account` | Company meal budget (singleton) | — |
| `company_transactions` | Company-paid deductions | M2O → cook_queue |

## Feature Docs

| Feature | Document |
|---|---|
| Auth | [Auth & Security](/features/auth-flow) |
| Cook Queue | [Cook Queue](/features/cook-queue) |
| Finance | [Finance & Balance](/features/finance) |
| Recipe System | [Recipe System](/features/recipe-system) |
| Shopping List | [Shopping List](/features/shopping-list) |
| Duty | [Duty Schedule](/features/duty) |
| Notifications & Push | [Notifications & Push](/features/notifications) |
| Deployment | [Deployment](/overview/deployment) |
