# ItoCook — Deployment & PWA

> Deploy date: 2026-06-24
> Server: Hetzner VPS (178.104.110.253)
> Domain: itocook.duckdns.org
> HTTPS: Let's Encrypt (certbot), expires 2026-09-21

## Architecture

```
                         ┌──────────────┐
                         │   DuckDNS    │
                         │ itocook.duck │
                         │  .dns.org    │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │    Nginx     │ 443 HTTPS (certbot)
                         │              │
                         │ / → :3000    │
                         │ /cms/ → :8055│
                         │ /api/ → :8000│
                         └──────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              ┌─────▼────┐ ┌───▼────┐ ┌───▼────┐
              │ Frontend │ │Directus│ │  API   │
              │ :3000    │ │ :8055  │ │ :8000  │
              │ Nuxt     │ │ CMS    │ │ FastAPI│
              │ SSR      │ │        │ │ Push   │
              └──────────┘ └────────┘ └───┬────┘
                    │                     │
                    └──────────┬──────────┘
                               │
                        ┌──────▼──────┐
                        │ PostgreSQL  │
                        │ :5432       │
                        └─────────────┘
```

All services run via `docker-compose.prod.yml`. Nginx terminates HTTPS and routes to containers by path.

## Files Created / Modified

| File | Purpose |
|------|---------|
| `frontend/Dockerfile` | Dev Dockerfile (kept original, `npm run dev`) |
| `frontend/Dockerfile.prod` | Prod multi-stage build (`node output/server/index.mjs`) |
| `api/Dockerfile` | Removed `--reload` flag |
| `docker-compose.prod.yml` | Production compose (4 services, no volumes, CORS on domain) |
| `.github/workflows/deploy.yml` | GitHub Actions auto-deploy on push to main |
| `frontend/nuxt.config.ts` | Added `@vite-pwa/nuxt` module + PWA manifest (`injectManifest`) |
| `frontend/public/icons/icon-192.png` | PWA icon placeholder (192x192) |
| `frontend/public/icons/icon-512.png` | PWA icon placeholder (512x512) |

## Key differences from dev

- **Ports mapping** — `127.0.0.1:PORT:PORT` for all services (Nginx proxies to localhost)
- **No code volume mounts** — prod builds from Docker image
- **Named volumes** — `postgres_data`, `directus_uploads`, `directus_extensions`
- **restart: unless-stopped** on all services
- **CORS origin** set to production domain
- **PWA** — `generateSW` strategy (switched from `injectManifest` due to Nuxt 4 `app/public/` same-file conflict)

## Server setup

1. DuckDNS: itocook.duckdns.org → 178.104.110.253 (cron every 5 min)
2. `/opt/itocook/.env` — secrets generated via `openssl rand -base64 32`
3. `/opt/itocook/app` — git clone from GitHub
4. `docker compose -f docker-compose.prod.yml up -d`
5. Nginx config + certbot HTTPS

## CI/CD

GitHub Actions (`deploy.yml`):
- Trigger: push to main
- Action: SSH → `git pull` → `docker compose build` → `docker compose up -d`

Secrets required:
- `SERVER_HOST` — 178.104.110.253
- `SERVER_SSH_KEY` — deploy key (ed25519)

## PWA Strategy

- `@vite-pwa/nuxt` with `generateSW` strategy (Workbox-generated service worker)
- Push notifications NOT yet implemented with `generateSW` — need workbox config or custom plugin
- Icons in `/icons/` (192x192, 512x512)
- Custom `sw.js` in `app/public/` is served as static asset but not compiled into the PWA SW

> **Note:** `injectManifest` fails because `swSrc` and `swDest` resolve to the same path in Nuxt 4's `app/public/` layout. The PWA module copies public dir contents to the output before building, causing self-overwrite.
