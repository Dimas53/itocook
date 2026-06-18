# Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS v4 | SSR, routing, UI |
| Icons | @phosphor-icons/vue (Ph prefix) | Consistent icon set |
| UI Framework | Nuxt UI (minimal usage) | Shared components |
| Backend/API | Directus 11 | REST API, RBAC, JWT auth, data layer |
| Database | PostgreSQL 15 | All persistent data |
| Microservice | FastAPI (Python) | Calculations, business logic, notifications |
| Infrastructure | Docker Compose | Orchestration (4 services) |
| AI Assistant | OpenRouter API | Culinary chat, pay per token only |
| Font | Jost (Google Fonts) | Clean geometric grotesque |

## Architecture Diagram

```
Browser (Nuxt 4)
      │
      ▼
Directus (REST API + Auth + Roles)
      │                    │
      ▼                    ▼
PostgreSQL            FastAPI (Python)
(all data)            (calculations, notifications)
                           │
                    ┌──────┴──────┐
                    ▼             ▼
             Email / Push    OpenRouter API
             (notifications) (AI assistant)
                                  │
                                  ▼
                         gemini-2.0-flash-lite
```

## Why Each Technology

- **Directus** over custom FastAPI: ready-made REST API, JWT auth, RBAC out of the box — saves thousands of lines of boilerplate.
- **Nuxt 4**: SSR for performance, file-based routing, auto-imports, and a robust middleware system.
- **Tailwind CSS**: Utility-first framework for fast layout without context-switching to CSS files.
- **PostgreSQL**: Reliable, mature, works great with Directus.
- **Docker Compose**: Single file orchestrates the entire backend stack.
- **OpenRouter**: Model-agnostic AI — switch models without code changes.
