# Deployment & Infrastructure

## Infrastructure Overview

| Component | Details |
|---|---|
| Server | Hetzner CX23 (2 vCPU, 4 GB RAM) |
| Domain | `itocook.duckdns.org` (DuckDNS dynamic DNS) |
| Repo path | `/opt/itocook/app` |
| Env file | `/opt/itocook/.env` (not in git) + copy to `app/.env` for compose |
| HTTPS | Let's Encrypt via certbot |
| Reverse proxy | nginx |

## Docker Services

Four containers orchestrated via `docker-compose.prod.yml`:

| Service | Image | Port | Notes |
|---|---|---|---|
| `postgres` | postgres:16-alpine | 5432 | Persistent data volume |
| `directus` | directus/directus:11 | 8055 | API + admin panel under `/cms` |
| `frontend` | Custom Dockerfile.prod | 3000 | Nuxt 4 SSR app |
| `api` | Custom api/Dockerfile | 8000 | FastAPI for push + calculations |

## Production Dockerfile

`frontend/Dockerfile.prod` — multi-stage build:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Key detail: `.output` with a leading dot.

## CI/CD Pipeline

`.github/workflows/deploy.yml` triggers on push to `main`:

```yaml
name: Deploy ItoCook
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/itocook/app
            git pull origin main
            docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d --build
```

### SSH Deploy Key Setup
```bash
ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
cat /root/.ssh/deploy_key.pub >> /root/.ssh/authorized_keys
```

GitHub Secrets: `SERVER_HOST` (IP), `SERVER_SSH_KEY` (private key).

## Nginx Configuration

```
itocook.duckdns.org:443 ─┬─ /api/send-push → FastAPI :8000
                         ├─ /api/*         → Nuxt :3000
                         ├─ /cms/*         → Directus :8055
                         ├─ static files   → Nuxt :3000 (with regex guard)
                         └─ /*             → Nuxt :3000
```

Critical regex for static assets:
```nginx
location ~* ^(?!/cms/).*\.(js|css|png|jpg|svg|ico|webmanifest|map)$ {
    proxy_pass http://127.0.0.1:3000;
}
```

The `^(?!/cms/)` negative lookahead prevents Directus admin assets (`/cms/admin/assets/*.js`) from being served as Nuxt HTML, which would cause MIME type errors.

## PWA Setup

- **Module:** `@vite-pwa/nuxt` with `generateSW` strategy (not `injectManifest` — caused build conflicts with Nuxt 4's `app/public/` directory)
- **Service Worker:** Auto-generated, imports `push-handler.js` via `importScripts`
- **Manifest:** `display: standalone`, 192x192 and 512x512 icons
- **Critical config:** `navigateFallback: null` — without this, the SW intercepts all navigation requests including `/cms/` and breaks Directus admin

## Push Notification Architecture

```
Directus Flow → exec → HTTP Request → FastAPI :8000
  POST /api/send-push { user_ids, title, message, url }
    │
    ├── Login to Directus as admin
    ├── Fetch push_subscriptions for user_ids
    ├── pywebpush.send() for each subscription
    └── Return { sent, failed }
```

VAPID keys generated via `npx web-push generate-vapid-keys`, stored in server `.env`.

## Known Issues & Resolutions

| Problem | Cause | Fix |
|---|---|---|
| Admin 400 Invalid email | `.local` domain invalid in Directus 11 | Use `admin@itocook.com` |
| Docker builds to wrong path | Dockerfile had `output/` instead of `.output/` | Fixed path |
| Directus JS MIME errors | nginx regex caught `/cms/` assets | `^(?!/cms/).*` regex guard |
| SW breaks Directus admin | `navigateFallback` intercepted `/cms/` | Set to `null` |
| Push subscriptions not saving | `user` field missing in POST body | Pass explicitly + presets |
| Duplicate push notifications | Multiple subscriptions per user | Dedup by endpoint GET before POST |
| CRON changes not taking effect | node-cron caches at process start | `docker compose restart directus` |
| DuckDNS DNS failure | Dynamic IP not updated | Manual `/opt/duckdns/duck.sh` |

## Server Management

```bash
# Status
docker ps

# Manual rebuild (if auto-deploy uses cache)
cd /opt/itocook/app
git pull
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env build --no-cache frontend
docker compose -f docker-compose.prod.yml --env-file /opt/itocook/.env up -d frontend

# DuckDNS fallback
/opt/duckdns/duck.sh && cat /opt/duckdns/duck.log

# Logs
docker logs itocook-frontend --tail 50
docker logs itocook-directus --tail 50
docker logs itocook-api --tail 50
```

## Operational Rules

1. **CRON changes require `docker compose restart directus`** — Directus node-cron registers schedule jobs at process start. Changing a CRON expression in the UI or via MCP does not take effect until the container restarts.

2. **Directus Flows are NOT version controlled** — Flow definitions live in the database, not in git. After modifying a flow locally, it must be manually recreated on production. There is no export/import mechanism.

3. **DST is automatic** — Container `TZ: Europe/Berlin` handles CEST/CET transitions. Write CRON expressions in Berlin local time.

## Lessons Learned

- Never use `navigateFallback` in workbox config — it intercepts all navigation requests including `/cms/` and breaks Directus.
- Don't switch SW strategy (injectManifest ↔ generateSW) without understanding — each switch leaves garbage in browser cache.
- `--build` flag in deploy.yml builds but doesn't `--force-recreate`. For env var changes, manually SSH and restart.
- SW with scope `/` intercepts ALL requests — test on a clean browser profile.
- `user` field must be passed explicitly when POSTing to `push_subscriptions` — `$CURRENT_USER` preset is for Directus UI forms only, not API calls.
