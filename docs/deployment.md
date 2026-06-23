# ItoCook — Deployment & PWA

> Deploy date: 2026-06-23
> Server: Hetzner VPS (178.104.110.253)
> Domain: itocook.duckdns.org

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

- **No `ports` mapping** — all traffic via Nginx
- **No code volume mounts** — prod builds from Docker image
- **Named volumes** — `postgres_data`, `directus_uploads`, `directus_extensions`
- **restart: unless-stopped** on all services
- **CORS origin** set to production domain
- **PWA** — `injectManifest` strategy preserves custom `sw.js`

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

- `@vite-pwa/nuxt` with `injectManifest` strategy
- Custom `sw.js` in `public/` is preserved (not overwritten by plugin)
- Service worker handles push events + notification clicks
- Icons in `/icons/` (192x192, 512x512)
