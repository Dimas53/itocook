# ItoCook

Office lunch management system — Nuxt 4 frontend, Directus backend, PostgreSQL database.

## Quick Start

```bash
docker-compose up -d
```

Once containers are running, enter the frontend container to install dependencies:

```bash
docker exec -it itocook-frontend-1 sh
cd /app && npm install && npm run dev
```

Or start the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

## Available URLs

| Service    | URL                                |
|------------|------------------------------------|
| Frontend   | http://localhost:3000               |
| Directus   | http://localhost:8055               |
| API        | http://localhost:8000 (FastAPI, coming soon) |
| PostgreSQL | localhost:5432 (connect via any DB client) |

## Stack

- **Frontend:** Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS / Pinia
- **Backend:** Directus (headless CMS + API)
- **API:** FastAPI / Python (planned)
- **DB:** PostgreSQL
- **Automation:** Directus Flows
