# Production Deployment & PWA

## Infrastructure Overview

- **Server:** Hetzner CX23, 2 vCPU, 4 GB RAM, 40 GB SSD
- **IP:** `178.104.110.253`
- **Domain:** `itocook.duckdns.org` (DuckDNS dynamic DNS, cron every 5 minutes)
- **Reverse proxy:** nginx with HTTPS via Let's Encrypt (certbot)
- **Repo location:** `/opt/itocook/app`
- **Environment:** `/opt/itocook/.env` (copied to `/opt/itocook/app/.env` at deploy time)

## Docker Compose Setup

### `docker-compose.prod.yml` — 4 services

| Service | Image | Port (host) | Purpose |
|---------|-------|-------------|---------|
| postgres | postgres:15 | — | Database |
| directus | directus/directus:11 | 127.0.0.1:8055 | CMS + API + Flows |
| frontend | custom (Dockerfile.prod) | 127.0.0.1:3000 | Nuxt app |
| api | custom (Dockerfile) | 127.0.0.1:8000 | FastAPI push sender |

All ports bind to `127.0.0.1` only — nginx is the sole entry point.

### Two compose files

- **`docker-compose.yml`** — used locally (dev). Has volume mounts for hot-reload, `--reload` flag for FastAPI, `CORS_ORIGIN=http://localhost:3000`.
- **`docker-compose.prod.yml`** — used on the server. No dev volumes, no `--reload`, production domain URLs, TZ, VAPID env vars, healthchecks.

The deploy script uses `-f docker-compose.prod.yml` explicitly.

### Key env vars (server `.env`)

```
POSTGRES_USER/PASSWORD/DB       — database credentials
DIRECTUS_KEY/SECRET             — Directus app secrets
DIRECTUS_ADMIN_EMAIL/PASSWORD   — Directus admin account
NUXT_PUBLIC_DIRECTUS_URL        — https://itocook.duckdns.org/cms
NUXT_PUBLIC_VAPID_PUBLIC_KEY    — VAPID public key for client
VAPID_PUBLIC_KEY                — VAPID public for FastAPI
VAPID_PRIVATE_KEY               — VAPID private key (never in git)
VAPID_SUBJECT                   — mailto: for push identification
```

### TZ=Europe/Berlin

Set on the `directus` service in `docker-compose.prod.yml`. Directus runs node-cron internally; CRON expressions should be written in Berlin local time (CET/CEST). DST is handled automatically by the OS timezone.

**Important:** CRON changes in Directus require `docker compose restart directus` to take effect — the scheduler caches cron jobs at process start.

## CI/CD Pipeline

**File:** `.github/workflows/deploy.yml`

Trigger: push to `main`.

Steps:
1. SSH into the server as root
2. `cd /opt/itocook/app && git pull origin main`
3. `docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d --build`

**Known limitation:** `--build` rebuilds images but does NOT `--force-recreate` containers. If a container's environment variables changed (e.g., `TZ`), the container must be manually recreated:

```bash
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d --force-recreate <service>
```

### SSH key setup

```bash
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys
# Copy /root/.ssh/deploy_key to GitHub Secrets → SERVER_SSH_KEY
```

## PWA Setup

### What was done

1. **`@vite-pwa/nuxt`** installed in `frontend/package.json` (production-only: `...isProd ? ['@vite-pwa/nuxt'] : []`)
2. **`generateSW` strategy** chosen over `injectManifest` — `injectManifest` caused a build conflict in Nuxt 4's `app/public/` where `swSrc` and `swDest` resolved to the same file
3. **Manifest link** added to `nuxt.config.ts` `app.head`:
   ```ts
   { rel: 'manifest', href: '/manifest.webmanifest' }
   ```
4. **Workbox config** with `importScripts: ['/push-handler.js']` and `runtimeCaching: []`
5. **`navigateFallback: null`** — critical. Without this, the SW intercepts ALL navigation including `/cms/` routes, causing MIME type errors in Directus admin
6. **Icons:** `frontend/app/public/icons/icon-192.png` + `icon-512.png`
7. **`push-handler.js`** in `frontend/app/public/` — handles `push` events (shows notification) and `notificationclick` (focuses/navigates to URL from payload)

### What NOT to do

- **Do NOT set `navigateFallback`** — it breaks Directus admin by intercepting `/cms/` navigations and returning HTML instead of JS/CSS
- **Do NOT switch SW strategy** without clearing browser cache on all clients — old SW stays in cache and conflicts
- **Do NOT add `location /admin/` or `location /assets/` blocks in nginx** — they conflict with `/cms/` and break Directus
- **Do NOT add `location = /push-handler.js { root /var/www; }`** — the file is served by Nuxt via `location /`

### SW registration flow

The `@vite-pwa/nuxt` module auto-registers the service worker in production builds (`NODE_ENV=production`). In dev mode, the module is skipped entirely. Registration happens via the module's built-in PWA client plugin — no custom `sw.client.ts` needed.

## Push Notifications Architecture

### VAPID keys

- Generated via `npx web-push generate-vapid-keys`
- Public key: served to client via `GET /api/push/vapid-key` (Nuxt server route)
- Private key: stored in server `.env` only, read by FastAPI `pywebpush`
- Subject (mailto:): also in `.env`

Both keys are set in `docker-compose.prod.yml` environment variables. Never in git.

### FastAPI `/send-push` endpoint

- Receives `{ user_ids: string[], message: string, url: string }`
- Logs into Directus as admin via `POST /auth/login`
- Fetches `push_subscriptions` matching each `user_id`
- Sends Web Push via `pywebpush` for each subscription
- Returns `{ sent: number, failed: number }`

### Frontend subscription flow (`usePushNotifications.ts`)

1. Check for existing subscription via `pushManager.getSubscription()`
2. If exists, reuse it; otherwise call `pushManager.subscribe()` with VAPID public key
3. **Dedup check:** `GET /items/push_subscriptions?filter[endpoint][_eq]=<endpoint>` — if a record with this endpoint already exists, skip POST
4. POST to `/items/push_subscriptions` with `{ endpoint, p256dh, auth, user: user.id }`

### Browser support

| Browser | Status | Notes |
|---------|--------|-------|
| iPhone Safari / PWA | ✅ Working | Push only works from installed PWA ("Add to Home Screen"), not from Safari tab |
| Firefox desktop | ✅ Working | Works from browser tab |
| Chrome desktop | ❌ FCM issue | `AbortError: push service error` — Chrome requires Firebase Cloud Messaging setup. Low priority. |

## nginx Configuration

The nginx config at `/etc/nginx/sites-available/itocook` has 4 location blocks:

### Static assets regex: `^(?!/cms/).*\.(js|css|png|jpg|svg|ico|webmanifest|map)$`

**This regex is critical and non-obvious.** It matches ALL static file requests EXCEPT those under `/cms/`. Without `^(?!/cms/)`, requests for Directus admin assets (e.g., `/cms/admin/assets/vue-router-DVuWcUA5.js`) would match this rule and be proxied to Nuxt (port 3000), which returns HTML instead of JS — causing MIME type errors in the browser.

```nginx
# Correct: excludes /cms/
location ~* ^(?!/cms/).*\.(js|css|png|jpg|svg|ico|webmanifest|map)$ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Cache-Control "public, max-age=3600";
}
```

### Other location blocks

- **`= /api/send-push`** — rewrites `/api/send-push` to `/send-push` and proxies to FastAPI (port 8000)
- **`/api/`** — all other API calls go to Nuxt (port 3000)
- **`/cms/`** — rewrites `/cms/...` to `...` and proxies to Directus (port 8055). Long timeouts for WebSocket/admin
- **`/`** — catch-all proxied to Nuxt (port 3000)

## Key Lessons Learned

### Dockerfile path: `.output` not `output`

The Nuxt build output directory is `.output` (with a dot), not `output`. A typo here causes the Docker image to fail at runtime with `ENOENT: no such file or directory`.

```dockerfile
COPY --from=builder /app/.output ./.output   # ✅ correct
```

### `navigateFallback` breaks Directus admin

Setting `navigateFallback` in the workbox config causes the Service Worker to intercept ALL navigation requests, including `/cms/admin/...`. The SW returns HTML for everything, breaking Directus admin with MIME type errors. Fix: set `navigateFallback: null` explicitly.

### SW strategy changes leave browser cache garbage

Each time the SW strategy or config changes, old cached assets remain in the browser. Always test SW changes in a clean browser profile or use "Clear site data" in DevTools → Application.

### nginx separate location blocks conflict with /cms/

Adding `location /admin/` or `location /assets/` blocks in nginx conflicts with the `/cms/` rewrite rule. Directus resolves its admin assets through `/cms/admin/` — any conflicting rule breaks asset loading. Don't add them.

### Directus Flows are NOT version controlled

Directus Flow definitions live in the database, not in git. After modifying a flow locally (via Directus MCP), it must be manually synced to production by recreating the same changes on the production Directus instance. There is no export/import mechanism in use.

### CRON changes require `docker compose restart directus`

Directus uses node-cron, which schedules jobs at process start. Changing a CRON expression in the Directus UI or via MCP does NOT take effect until the container is restarted:

```bash
docker compose -f docker-compose.prod.yml restart directus
```

### DuckDNS can drop

If the site becomes unreachable, DuckDNS may have failed to update the IP. Run the update script manually:

```bash
/opt/duckdns/duck.sh && cat /opt/duckdns/duck.log
```

Wait 2-3 minutes for DNS propagation.

## Files Involved

- `frontend/Dockerfile.prod` — multi-stage build (builder → runner)
- `frontend/nuxt.config.ts` — PWA config, workbox, manifest, app.head
- `frontend/app/public/push-handler.js` — Service Worker push handler
- `frontend/app/public/icons/icon-192.png` + `icon-512.png` — PWA icons
- `frontend/app/composables/usePushNotifications.ts` — subscription management
- `frontend/server/api/push/vapid-key.get.ts` — VAPID public key endpoint
- `api/app/main.py` — FastAPI `/send-push` endpoint
- `.github/workflows/deploy.yml` — CI/CD pipeline
- `docker-compose.prod.yml` — production compose file
