# Notifications & PWA Push

## What It Does

Provides two-tier notification delivery for ItoCook users:

1. **In-app notifications** — displayed via a bell icon on every page and the `/notifications` page. Triggered by Directus Flows that create records in the `notifications` collection.
2. **Push notifications** — system-level notifications delivered to the device (iPhone PWA, desktop Firefox). Sent by FastAPI `/send-push` endpoint using the Web Push API.

All 9 Directus Flows create a `notifications` record AND call `/api/send-push` to deliver push. The user sees both in-app and push for the same event.

## Collections Used

### `notifications`
| Field | Type | Purpose |
|-------|------|---------|
| id | uuid PK | Primary key |
| user | M2O → directus_users | Notification recipient |
| type | string (dropdown) | One of: `cook_assigned`, `lunch_ready`, `balance_low`, `morning_reminder`, `duty_reminder`, `duty_assigned`, `cook_cancelled`, `cook_reminder` |
| message | text | Human-readable notification text |
| read | boolean (default false) | Read/unread tracking |
| date_created | timestamp (auto) | When notification was created |

**Permissions (User policy):**
- Read: own only (filter `user = $CURRENT_USER`)
- Update: `read` field only (same filter)
- Create: DENY
- Delete: DENY

### `push_subscriptions`
| Field | Type | Purpose |
|-------|------|---------|
| id | uuid PK | Primary key |
| endpoint | string | Push service endpoint URL |
| p256dh | string | Public key for encryption |
| auth | string | Authentication secret |
| user | M2O → directus_users | Subscription owner |

**Permissions (User policy):**
- Create: own only (preset `user = $CURRENT_USER`)
- Read: own only
- Delete: own only

## Files Involved

### Frontend composables
- `frontend/app/composables/useNotifications.ts` — polling (20s), `fetchNotifications()`, `markAsRead()`, `markAllAsRead()`, `unreadCount` computed
- `frontend/app/composables/usePushNotifications.ts` — SW registration, `pushManager.subscribe()`, save/check in Directus (`push_subscriptions`)

### Frontend components & pages
- `frontend/app/components/NotificationBell.vue` — bell icon with unread badge on all pages; tap → `/notifications`
- `frontend/app/pages/notifications.vue` — full notification list with icon mapping, timeAgo, read/unread styling, "Dismiss all" button
- `frontend/app/public/push-handler.js` — Service Worker push event handler (runs in SW context, not Vue app)

### Server routes
- `frontend/server/api/push/vapid-key.get.ts` — returns VAPID public key to the client
- `frontend/server/api/notifications/read.patch.ts` — admin-proxy batch PATCH for marking notifications as read

### Backend
- `api/app/main.py` — FastAPI `POST /send-push` endpoint; logs into Directus as admin, fetches subscriptions by user_id, sends push via `pywebpush`

## All Directus Flows (9 total)

| # | Flow Name | Trigger | Purpose |
| 1 | Cook Assigned | event → `cook_queue.items.update`, when `dish_name` is set | Notifies all active users that a cook is cooking today |
| 2 | Lunch Ready | event → `cook_queue.items.update`, status = `ready` | Notifies confirmed participants that lunch is ready |
| 3 | Balance Low | event → `balances.items.update`, amount < -10 | Notifies user their balance is low |
| 4 | Morning Reminder | schedule → CRON `0 */30 9-10 * * 1-5` (Berlin) | Reminds at 9:00/9:30/10:00 when no cook assigned for today |
| 5 | Duty Reminder | schedule → CRON `30 10 * * 1-5` (Berlin) | Reminds at 10:30 to confirm kitchen duty |
| 6 | Duty Assigned | event → `cleaning_schedule.items.create` | Notifies user they were assigned to duty |
| 7 | Cook Cancelled | event → `cook_queue.items.update`, status = `cancelled` | Notifies all active users that cooking was cancelled |
| 8 | Cook Stale Reminder | schedule → CRON `0 */30 9-10 * * 1-5` (Berlin) | Reminds scheduled cooks who haven't started at 9:00/9:30/10:00 |
| 9 | Nightly Notification Cleanup | schedule → CRON `0 3 * * *` | Deletes notifications older than 7 days |

### Flow Architecture (common pattern)

Schedule flows (Morning Reminder, Cook Stale Reminder, Duty Reminder) include an initial `check_time` guard that skips the 10:30 AM tick using `new Date().getHours()`. The CRON fires every 30 minutes within the 9:00–10:00 hour window, and 10:30 is explicitly skipped to keep the reminder window to 9:00–10:00.

All notification flows (both event-driven and schedule-driven) follow this chain:
```
Trigger → condition check → fetch users/orders → build payload → [Util] Create Notification → build push data → send push
```

The utility flow "[Util] Create Notification" (operation trigger) creates a single `notifications` record. The push step (a `push_ids` exec + `send_push` request operation) calls FastAPI `/send-push` with `user_ids` and message payload. Schedule flows (Morning Reminder, Cook Stale Reminder) have the same push chain — they are not in-app-only.

## Key Design Decisions

**No email** — All notifications are in-app + push only. No SMTP setup, no email templates. Simpler to maintain and sufficient for a kitchen-duty app where users check the app daily.

**FastAPI for push sending** — Push delivery uses the `pywebpush` library running in a separate FastAPI service (not inside Directus). This isolates push logic from Directus and avoids the need for a Directus extension.

**VAPID keys in server `.env` only** — The private key never reaches the browser. The client fetches only the public key via `GET /api/push/vapid-key` (Nuxt server route). The FastAPI service reads both keys from environment variables.

**`navigateFallback: null`** — The Workbox config disables `navigateFallback` because it intercepts ALL navigation requests including Directus admin routes (`/cms/...`). Without this fix, the browser receives HTML instead of JS/CSS for Directus admin, causing MIME type errors.

**Dedup on re-login** — `usePushNotifications.subscribe()` checks for an existing subscription endpoint in Directus before creating a new record. This prevents duplicate subscriptions per user that would cause duplicate push notifications.

**20000ms polling interval** — `useNotifications` polls every 20 seconds. Short enough to feel responsive for in-app notifications, long enough to avoid unnecessary API load.

## Known Limitations

- **Chrome desktop push**: `AbortError: push service error` — Chrome uses FCM (Firebase Cloud Messaging) which has additional requirements. Low priority until needed.
- **Push only from PWA** — On iPhone, push notifications only work from the installed PWA ("Add to Home Screen"), not from Safari browser tab. On desktop, Firefox works from the browser tab; Chrome does not.
- **No real-time push** — In-app notifications rely on polling (20s interval). No WebSocket or server-sent events. Events are delivered within 20s of creation.
- **Morning Reminder on production still uses throw-based `check_no_cook` guard** — The local version was migrated to a clean Condition operation, but the production flow was not updated to minimize deployment risk. The flow works correctly either way. Low priority cosmetic issue.
