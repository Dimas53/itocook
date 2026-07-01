# Spec: Phase 6 — In-App Notifications

> Status: 🟡 Mostly done (Steps 5-7 remain)

## Objective

Business logic notifications via Directus Flows. No FastAPI, no email — only `notifications` collection + Nuxt UI + push.

## Directus Flows (9 total)

| Flow | Trigger | Purpose |
|------|---------|---------|
| Cook Assigned | event (items.create cook_queue) | Notify when assigned as cook |
| Lunch Ready | event (items.update status→ready) | Notify all participants |
| Balance Low | event (items.update balance) | Warn when balance drops |
| Morning Reminder | schedule (CRON) | Daily breakfast reminder |
| Duty Reminder | schedule (CRON `30 10 * * 1-5`) | Remind today's duty |
| Duty Assigned | event (items.create cleaning_schedule) | Notify duty assignment |
| Cook Cancelled | event (items.update status→cancelled) | Notify all users |
| Cook Stale Reminder | schedule (CRON `0 */30 9-10 * * 1-5`) | Remind cook who hasn't started |
| Nightly Cleanup | schedule (CRON `0 3 * * *`) | Delete notifications > 7 days |

## Key Components

- `useNotifications.ts` — poll every 20s, markAsRead, markAllAsRead
- `NotificationBell.vue` — badge on all pages
- `/notifications` page — list with type icons, timeAgo

## Boundaries

- **Always:** Utility flow `[Util] Create Notification` for reusable notification creation
- **Ask first:** Adding new flow types, changing poll interval, notification retention period
- **Never:** Edit flows without noting they're not in git

## Key Gotchas

- CRON changes require `docker compose restart directus` (node-cron caches at process start)
- Container `TZ: Europe/Berlin` — all CRON in Berlin local time
- `check_time` exec + Condition blocks redundant morning reminders at 10:30
- Flow definitions NOT version controlled — manual production sync
- All flows call `send_push` operation for Web Push delivery

## Success Criteria

1. All 9 flows active and triggering correctly
2. Notifications appear in `/notifications` page within 20s
3. Mark as read persists across page reload
4. Nightly Cleanup removes notifications > 7 days

## Open Questions

- Step 5: add `completed` status to `cook_queue`, `left_late`/`pending_cook_approval` to `orders`
- Step 6: ghost-participant leave penalty logic
- Step 7: notification preferences in profile
