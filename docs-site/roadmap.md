# Roadmap

Development is organized into 8 phases. Phases 1–4 are complete or in progress. Phases 5–8 cover remaining screens, notifications, IHK documentation, and MVP launch.

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

## Phase 4: Feature Screens 🟡 (in progress)

### Navigation ✅
- [x] Tab 1 — Home
- [x] Tab 2 — Kitchen
- [x] Tab 3 — AI Recipe (Admin → Finance)
- [x] Tab 4 — Duty
- [x] Tab 5 — Common
- [x] Tab replacement for Admin/Accountant

### Main Screens
- [x] Home — hero, balance, duty, dish cards
- [x] Kitchen — week calendar, dish history
- [ ] AI Recipe — chat + JSON render
- [ ] Duty — calendar, confirm, admin edit
- [ ] Common — announcements, pool collections

### Inner Screens
- [x] Profile — avatar, my list, my recipes, logout
- [x] Cook Panel — 6-state machine
- [x] All Recipes — search + filter
- [x] Recipe Detail — photo, servings, join, like
- [x] Recipe Create/Edit — upload, ingredients, steps
- [x] Finance — balances, top-up, transactions
- [x] Duty — calendar, confirm, admin edit
- [x] Shopping List — by recipe / all items

## Phase 5: Remaining Feature Screens
- [ ] Share shopping list
- [ ] Profile balance + transaction history
- [ ] Recipe Detail — cooking steps display
- [ ] AI Recipe screen
- [ ] Duty screen completion
- [ ] Common screen

## Phase 6: FastAPI + Notifications
- [ ] Directus Flows for email
- [ ] FastAPI notification endpoint
- [ ] Morning reminder
- [ ] Lunch ready notification
- [ ] Negative balance alert
- [ ] Kitchen duty reminder

## Phase 7: Additional Features
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
