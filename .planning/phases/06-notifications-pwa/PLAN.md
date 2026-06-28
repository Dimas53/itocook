# Phase 6: In-App Notifications + PWA

## Goal
Business logic notifications work automatically via Directus Flows. PWA installable on iPhone with push notifications.

## Completed
### In-App Notifications
- `notifications` collection with fields: id (uuid PK), user (M2O), type (dropdown: 7 types), message (text), read (boolean)
- User policy permissions: read own only, update `read` only, create/delete denied
- 4 Directus Flows:
  - Cook Assigned — event on cook_queue create/update with dish_name
  - Lunch Ready — event on cook_queue status → ready
  - Balance Low — event on balances amount < -10
  - Morning Reminder — schedule CRON 8:00 Mon-Fri
- Utility Flow `[Util] Create Notification` — reusable operation-triggered flow
- `useNotifications.ts` composable — poll 20s, markAsRead, markAllAsRead, unreadCount
- `NotificationBell.vue` — PhBell/PhBellRinging with unread badge
- `/notifications` page — card list, icons per type, timeAgo, read/unread styling, skeleton loading, empty state
- CORS fix — admin-proxy server route for batch mark-as-read
- Duty Reminder Flow (CRON 8:00 Mon-Fri, two branches: manual keys / schedule)
- Duty Assigned Flow (event on cleaning_schedule create)
- Cook Cancelled Flow — notifies all users when cook cancels
- Nightly Notification Cleanup Flow — CRON 3:00, deletes notifications older than 7 days
- All flows tested: Cook Assigned (44 notifications created), Lunch Ready, Balance Low, Morning Reminder (11 users), Duty Reminder, Duty Assigned
- All flows include webhook step calling FastAPI `/send-push`

### PWA
- `@vite-pwa/nuxt` installed with `generateSW` strategy
- PWA manifest: name, short_name, `display: standalone`, 192x192 + 512x512 icons
- `<link rel="manifest">` in app head
- iPhone "Add to Home Screen" → standalone mode works

### Web Push Notifications
- VAPID keys in `.env` + `NUXT_PUBLIC_VAPID_PUBLIC_KEY`
- `push_subscriptions` Directus collection with create/read/delete permissions
- FastAPI `/send-push` endpoint with pywebpush
- `push-handler.js` — handles push events + notificationclick (focus existing window or open new, navigate to URL)
- `usePushNotifications.ts` composable — register SW, subscribe with VAPID, dedup by endpoint
- `subscribe()` called after login + on page reload (middleware)
- All 6 Directus Flows call `/api/send-push` with user_ids + message + URL
- Push click → `/kitchen?date=YYYY-MM-DD` for Cook Assigned notifications
- iPhone push ✅ working after PWA install
- Firefox desktop push ✅ working
- Firefox duplicate fix — dedup by endpoint before POST

## Key decisions
- `generateSW` over `injectManifest` (Nuxt 4 `app/public/` path conflict — swSrc/swDest resolve to same file)
- `navigateFallback: null` — critical to prevent SW from hijacking Directus CMS JS/CSS
- Directus Flows + Nuxt UI for notifications (no email, no separate push server)
- FastAPI for push delivery (simple endpoint, no complex infrastructure)
- Utility flow pattern for reusable notification creation
- Array.isArray guard on item-read results (Directus returns array directly, not `{data: [...]}`)
- Condition filter syntax: nested objects, never dot notation

## Key files created/modified
- `frontend/app/composables/useNotifications.ts`, `usePushNotifications.ts`
- `frontend/server/api/push/vapid-key.get.ts`
- `frontend/server/api/notifications/read.patch.ts`
- `frontend/app/public/push-handler.js`, `frontend/app/public/icons/icon-192.png`
- `frontend/app/components/NotificationBell.vue`
- `frontend/app/pages/notifications.vue`
- `api/app/main.py` (FastAPI /send-push)
- `frontend/nuxt.config.ts` (PWA + workbox config)
- 6 Directus Flows in Directus admin

## Remaining
- SW build on server (need to verify `generateSW` config after deploy)
- Chrome push: FCM `push service error` (low priority)
- Step 5: Fix status choices in Directus (add `completed` to cook_queue, `left_late`/`pending_cook_approval` to orders)
- Step 6: Ghost-participant logic
- Step 7: Notification preferences in profile

## Status
DONE ✅ — 2026-06-27
