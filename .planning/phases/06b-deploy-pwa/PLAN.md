# Phase 6b: Deploy & PWA

## Goal
Production on Hetzner VPS; PWA installable; push notifications.

## Remaining Tasks
- [ ] SSH deploy key — add to GitHub Secrets
- [ ] Restore SW: ensure generateSW config is correct in nuxt.config.ts with workbox.importScripts
- [ ] Verify `<link rel="manifest">` is in HTML
- [ ] Investigate Chrome push: FCM `push service error`
- [ ] Trigger test push via Directus Flow or FastAPI

## Dependencies
- Server running (DONE)
- Docker compose prod (DONE)
- Nginx + HTTPS (DONE)

## Status
Mostly done (deploy verified, PWA on iPhone works, Firefox push works)
