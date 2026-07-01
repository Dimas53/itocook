# Roadmap

Development is organized into 8 phases. Phases 1–5 are complete. Phase 6 and 6b are complete. Phase 6c covers post-Phase-6 additions. Phases 7–8 cover additional features, IHK documentation, and MVP launch.

## Phase 1: UI Skeleton ✅ 2026-06-02
**Goal:** can open the app, navigate through screens, see the final layout of all screens. No real data — only UI.

### M1: UI Foundation & Design System ✅
- [x] Design system — tokens, fonts, Tailwind config
- [x] iPhone frame layout, Dynamic Island
- [x] Onboarding screen
- [x] Auth screen
- [x] Tailwind config full sync
- [x] Nuxt config

### M2: Layout & Global Navigation ✅
- [x] BottomTabBar — 5 tabs, Phosphor icons, active/inactive
- [x] Tab bar integrated in default.vue

### M3: Core Authentication Flow ✅
- [x] auth.vue — form, validation, errors, loading state
- [x] Fake login (hardcoded user)
- [x] Redirect after login to Home
- [x] Route protection

## Phase 2: First Live Flow ✅ 2026-06-03
- [x] useDirectus composable
- [x] Rewrite useAuth with real Directus login
- [x] Global middleware with live token check
- [x] Real data on home page
- [x] Registration via server proxy
- [x] Dynamic redirect (cook → /cook, else → /)

## Phase 3: Directus Schema Setup ✅ 2026-06-03
- [x] cook_queue, orders, order_items
- [x] transactions, balances
- [x] recipes, recipe_likes, app_settings

## Phase 4: Feature Screens ✅ 2026-06-17

### Navigation ✅
- [x] Tab 1 — Home
- [x] Tab 2 — Kitchen
- [x] Tab 3 — AI Recipe (Admin → Finance)
- [x] Tab 4 — Duty
- [x] Tab 5 — Common
- [x] Tab replacement for Admin/Accountant

### Main Screens ✅
- [x] Home — hero, balance, duty, dish cards
- [x] Kitchen — week calendar, dish history
- [x] Duty — calendar, confirm, admin edit
- [x] Profile — avatar, my list, my recipes, balance, logout

### Inner Screens ✅
- [x] Cook Panel — 6-state machine
- [x] All Recipes — search + filter
- [x] Recipe Detail — photo, servings, steps, share, join, like
- [x] Recipe Create/Edit — upload, ingredients, steps
- [x] Finance — balances, top-up, transactions
- [x] Shopping List — by recipe / all items

## Phase 5: Remaining Feature Screens ✅ 2026-06-17
- [x] Share shopping list
- [x] Profile balance + transaction history
- [x] Recipe Detail — cooking steps display

## Phase 6: In-App & Push Notifications ✅ 2026-06-27

### In-App Notifications ✅
- [x] `notifications` collection in Directus with permissions
- [x] Utility Flow `[Util] Create Notification`
- [x] `useNotifications` composable — fetch, markAsRead, markAllAsRead, poll 20s
- [x] `NotificationBell` on all pages
- [x] `/notifications` page — list, icons, timeAgo, markAllAsRead

### Event-Driven Flows ✅
- [x] Cook Assigned Flow — notifies when cook sets dish name
- [x] Lunch Ready Flow — notifies all confirmed participants
- [x] Balance Low Flow — alerts user when balance drops below -5 EUR
- [x] Duty Assigned Flow — notifies when admin assigns cleaning duty
- [x] Cook Cancelled Flow — notifies all users when cook cancels

### Schedule Flows ✅
- [x] Morning Reminder Flow — daily at 8:30 (Mon-Fri)
- [x] Duty Reminder Flow — daily at 8:00 (Mon-Fri)
- [x] Nightly Cleanup Flow — deletes notifications older than 7 days at 3:00

### PWA & Push Delivery ✅
- [x] VAPID keys configured
- [x] `push_subscriptions` collection with permissions
- [x] FastAPI `/send-push` endpoint
- [x] `push-handler.js` for SW push events
- [x] `usePushNotifications` composable with dedup
- [x] subscribe on login + on page reload (middleware)
- [x] notification click navigates to relevant page
- [x] All 9 flows call FastAPI for push delivery

### Fixes (27.06.2026) ✅
- [x] `user` field passed explicitly in push_subscriptions POST
- [x] Read permission added for push_subscriptions (dedup check)
- [x] navigateFallback disabled (`null`) in workbox config
- [x] Subscription dedup by endpoint to prevent duplicates
- [x] Cook Assigned flow restored — dish_name guard moved to exec

## Phase 6b: Duty Notifications & Push Bugfixes ✅ 2026-06-27
- [x] Duty Reminder Flow — CRON 8:00 Mon-Fri with manual + schedule branches
- [x] Duty Assigned event flow — `items.create` notification
- [x] Cook Cancelled Flow — system-wide cancel alert
- [x] Firefox duplicate push fix — dedup by subscription endpoint
- [x] Chrome push — identified as FCM limitation (low priority)
- [x] iPhone PWA push — tested and working

## Phase 6c: Post-Phase-6 Additions ✅ 2026-06-30
- [x] TZ fix — timezone set to Europe/Berlin in docker-compose.prod.yml
- [x] Cook Stale Reminder Flow — CRON 9:00-10:00 Mon-Fri
- [x] Push: `cook_reminder` type added to notification dropdown

## Phase 7: Additional Features 🟡
- [ ] Anonymous ratings and reviews
- [ ] AI recipe recalculation
- [ ] Shopping list export
- [ ] Receipt photo upload
- [ ] Weekly vote

## Phase 8: IHK Documentation + MVP Launch
- [ ] Test week with real users
- [ ] Feedback collection and fixes
- [ ] Mini guide for users
- [ ] Full accounting access
- [ ] IHK documentation
