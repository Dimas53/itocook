# Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS v4 | SSR, routing, UI |
| Icons | @phosphor-icons/vue (Ph prefix) | Consistent icon set |
| UI Framework | Nuxt UI (minimal usage) | Shared components |
| PWA | @vite-pwa/nuxt (generateSW) | Service Worker, Web Push, standalone install |
| Backend/API | Directus 11 | REST API, RBAC, JWT auth, data layer |
| Database | PostgreSQL 15 | All persistent data |
| Microservice | FastAPI (Python) | Push notification delivery, calculations |
| Infrastructure | Docker Compose | Orchestration (4 services) |
| CI/CD | GitHub Actions | Auto-deploy on push to main |
| Hosting | Hetzner CX23 + DuckDNS + Let's Encrypt | Production deployment |
| AI Assistant | OpenRouter API | Culinary chat, pay per token only |
| Font | Jost (Google Fonts) | Clean geometric grotesque |

## Architecture Diagram

```
Browser (Nuxt 4 SPA + SSR)
       │
       ├── /api/* → Nuxt Server Routes (admin-proxy)
       │     └── getAdminToken() → Directus Admin API
       │
       ├── /cms/* → Directus (REST API + Auth + RBAC)
       │     └── PostgreSQL (all persistent data)
       │
       └── /api/send-push → FastAPI (Python)
             └── pywebpush → Browser Push Service
                   ├── Apple Push (iPhone Safari PWA)
                   ├── Mozilla Push (Firefox)
                   └── [FCM — not yet working]
```

## Why Each Technology

- **Directus** over custom FastAPI: ready-made REST API, JWT auth, RBAC out of the box — saves thousands of lines of boilerplate.
- **Nuxt 4**: SSR for performance, file-based routing, auto-imports, and a robust middleware system.
- **Tailwind CSS**: Utility-first framework for fast layout without context-switching to CSS files.
- **PostgreSQL**: Reliable, mature, works great with Directus.
- **Docker Compose**: Single file orchestrates the entire backend stack.
- **@vite-pwa/nuxt**: PWA module with generateSW strategy — handles Service Worker generation, manifest, and Web Push integration.
- **FastAPI**: Dedicated microservice for push notification delivery — keeps push logic separate from the main Nuxt/Directus stack.
- **OpenRouter**: Model-agnostic AI — switch models without code changes.
