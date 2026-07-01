# Spec: Phase 6b — Deploy & PWA

> Status: 🟡 Mostly done (Chrome push wontfix)

## Objective

Production on Hetzner VPS. PWA installable on iPhone. Push notifications on mobile.

## Infrastructure

```
itocook.duckdns.org
├── / → Nuxt (port 3000)
├── /cms → Directus Admin
├── /api → FastAPI (port 8000)
└── HTTPS via Let's Encrypt (certbot)
```

## Services

| Service | Container | Port |
|---------|-----------|------|
| Nuxt | `itocook-frontend` | 3000 |
| Directus | `itocook-directus` | 8055 |
| PostgreSQL | `itocook-postgres` | 5432 |
| FastAPI | `itocook-api` | 8000 |

## Deploy Pipeline

- GitHub Actions (`.github/workflows/deploy.yml`)
- SSH deploy key → server
- `docker compose up -d --build` via SSH
- DuckDNS cron every 5 min

## PWA

- `@vite-pwa/nuxt` with `generateSW` (NOT `injectManifest`)
- Icons: 192×192, 512×512 in `frontend/app/public/icons/`
- iPhone "Add to Home Screen" → standalone mode
- `navigateFallback: null` in workbox config

## Push Notifications

- VAPID keys in `.env`
- `push_subscriptions` collection (endpoint, p256dh, auth, user)
- FastAPI `/send-push` endpoint (pywebpush)
- `push-handler.js` in `app/public/` — imported by SW via `importScripts`
- `usePushNotifications.ts` — subscribe on login, unsubscribe on logout

## Key Gotchas

- `navigateFallback` MUST be `null` — otherwise SW intercepts Directus /cms and breaks admin
- **NEVER** switch between `injectManifest` and `generateSW` without clearing ALL browser caches
- Nginx `location ~* ^(?!/cms/).*\.(js|css...)` — prevents Nuxt from hijacking Directus JS files
- `push-handler.js` path: Nuxt `app/public/`, NOT `/var/www/`
- Chrome push: FCM error — wontfix (Firefox + iPhone work)
- CRON + container TZ: `TZ: Europe/Berlin` on directus service

## Success Criteria

1. HTTPS at itocook.duckdns.org works
2. Auto-deploy on push completes successfully
3. PWA installable on iPhone via "Add to Home Screen"
4. Push notifications delivered on Firefox + iPhone PWA
5. Directus admin accessible at `/cms`
6. FastAPI health endpoint responds
