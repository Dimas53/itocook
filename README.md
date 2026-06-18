# ItoCook

Office lunch management system — **Nuxt 4** frontend, **Directus** backend, **PostgreSQL** database.

## Prerequisites

- Docker & Docker Compose (PostgreSQL, Directus, Nuxt, FastAPI)
- Node.js 20+ (for local frontend development outside Docker)
- `.env` file in project root (copy from `.env.example`)

## Setup

### 1. Environment

```bash
cp .env.example .env
```

Fill in the values in `.env`. **Do not commit `.env` to git.**

### 2. Start all services (Docker)

```bash
docker compose up -d
```

Waits for PostgreSQL to be healthy, then starts Directus, Nuxt frontend, and FastAPI.

### 3. Verify

```bash
docker ps
```

Expected containers: `itocook-postgres`, `itocook-directus`, `itocook-frontend`, `itocook-api`.

## URLs

| Service    | URL                     |
|------------|-------------------------|
| Frontend   | http://localhost:3000    |
| Directus   | http://localhost:8055    |
| API        | http://localhost:8000    |
| PostgreSQL | localhost:5432           |

## Development

### Run frontend locally (hot-reload)

Directus and DB stay in Docker; only the frontend runs on your host:

```bash
cd frontend
npm install
npm run dev
```


## Useful commands

| Action | Command |
|---|---|
| Start everything | `docker compose up -d` |
| Stop everything | `docker compose down` |
| View logs (all) | `docker compose logs -f` |
| View logs (service) | `docker compose logs -f frontend` |
| Rebuild service | `docker compose up -d --build frontend` |
| Enter container | `docker exec -it itocook-frontend sh` |

## Architecture

- **Frontend:** Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS v4 / Phosphor Icons
- **Backend CMS:** Directus 11 — auto-generates REST API from collection definitions
- **Auth:** Directus JWT (email/password), admin-proxy for privileged operations
- **DB:** PostgreSQL 15
- **Automation:** Directus Flows (event hooks, CRON, webhooks)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design decisions, data flows, and API endpoints.

## Docs

| File | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | High-level architecture + per-component design decisions |
| [docs/CONTEXT.md](docs/CONTEXT.md) | Domain glossary (30+ terms with file/collection references) |
| [docs/project-state.md](docs/project-state.md) | Full project inventory (files, schema, composables, flows) |
| [docs/roadmap.md](docs/roadmap.md) | Development phases and milestones |
| [docs/progress.md](docs/progress.md) | Daily progress log |
| [docs/design.md](docs/design.md) | Design system (colors, typography, components) |

## VitePress Documentation Site

A **VitePress** site at `docs-site/` provides a browsable documentation portal built from the `docs/` content.

```bash
cd docs-site
npm run docs:dev      # dev server at http://localhost:5173
npm run docs:build    # static build → .vitepress/dist/
npm run docs:preview  # preview the static build
```

**Note:** This is a **static site** — it does NOT auto-sync with `docs/`. When source files in `docs/` change, the corresponding `docs-site/` markdown pages must be updated manually, then the site rebuilt via `npm run docs:build`.

**Screenshots:** Drop `.png` files into `docs-site/public/screenshots/` — they are already referenced from screenshot placeholder comments in the Screens section.
