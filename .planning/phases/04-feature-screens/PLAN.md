# Phase 4: Feature Screens

## Goal
Final layout of all app screens adapted to real Directus data. Build billing, shopping list, duty, notifications, and all inner screens.

## Completed
### Navigation & Layout
- Bottom Tab Bar fully functional with 5 tabs (Home, Kitchen, AI/Finance, Duty, Common)
- Tab 3 conditional swap: Admin/Accountant → Finance tab (PhChartBar) instead of AI Recipe (PhSparkle)
- iPhone frame layout refactored — `app.vue` layout, `default.vue` for auth/onboarding
- Nuxt 4 `app/` directory structure migration
- Safe area fixes (4 iterations) — correct padding for Dynamic Island + home indicator
- Responsive layout — iPhone frame hidden on real devices (media query ≤480px)

### Home Screen
- Greeting + avatar + user name
- `HeroBlock.vue` — 3 states (loading/cook/empty), category image or uploaded photo, participant modal
- Balance widget + Duty widget
- Recipe cards with like counts, dedup by dish_name
- Recent dishes grid (2-column)
- "I'm cooking today!" CTA when no cook assigned

### Kitchen Screen
- Today's cook block with HeroBlock
- Week calendar with dot indicators, week navigation
- Dish history with search, cook name, date, like counts
- "All Recipes →" link

### Recipe System
- Recipe CRUD with photo upload (file picker / drag & drop / paste from clipboard)
- Client-side image resize (max 1200px, JPEG 0.85)
- Fork-on-cook pattern (copy recipe with `forked_from` pointer)
- Recipe dedup by dish_name
- Recipe like/unlike with `recipe_likes` junction
- Servings scaling with ingredient amount recalculation
- "Cook This" button with full-month date picker from recipe detail

### Cook Panel (State Machine)
- States: loading → assign → dish → scheduled → cooking → ready → done
- Dish selection: from history picker or enter new name + category
- "Lunch is ready" decoupled from cost entry (Task A')
- Cancel Cooking button (Task C) with shopping list cleanup
- Receipt input + pasta package add-on cost
- Deduction confirmation via admin-proxy
- Balance gate (< -30€ blocks Join/Become Cook)
- Fork-on-cook with recipe-to-queue linking

### Billing Tasks
- Task A' — "Lunch is ready" separated from receipt entry
- Task C — Cook cancels queue entry
- Task E — Admin Finance page (balances, top-ups, transaction history, pasta price edit)
- Task F — Pasta cost in deduction (`pasta_packages` field, `app_settings.pasta_package_price`)
- Balance gate composable (`useBalanceCheck`, threshold -30€)
- confirmDeduction moved to server admin-proxy (horizontal escalation fix)

### Shopping List
- `shopping_list_items` collection with M2O relations
- Shopping list page — By Recipe / All Items tabs, check/uncheck, select-all, delete checked
- Add to shopping list from recipe detail (bottom sheet with 3 actions)
- Auto-cleanup on deduction confirm and cancel cooking
- Kitchen widget (ShoppingListWidget) with count badge
- Copy ingredients to clipboard with emoji + scaled amounts

### Duty System
- `cleaning_schedule` collection with M2O user + department + confirmed
- Duty page — today's card with confirm button, monthly calendar
- Admin edit mode — tap cell, select user + department, upsert via server proxy
- `MonthCalendar.vue` reusable component (also used in recipe date picker)
- `DutyWidget.vue` with live data and gradient backgrounds
- Department selector in profile preferences

### Profile Screen
- Avatar upload (client-side resize, Directus files, server proxy PATCH `/users/me`)
- Name, email, department selector in preferences bottom sheet
- Balance block with color-coded amount + transaction history
- My List (participated dishes) with leave confirmation + 10h rule
- My Recipes (created by user) with pastel colors
- All pravatar references removed; `AvatarPlaceholder.vue` SVG fallback

### UI Polish
- Consistent avatar URLs across all screens
- Status-based bottom controls in recipe detail
- Like counts batch-fetched for Home + Kitchen
- Category filter case-insensitive
- Calendar today highlight (bg-purple-100)
- Safe area fixes, mobile responsive layout
- Onboarding redesign — gradient bg, dot pattern, logo, splash screen
- HeroBlock empty-state CTA

## Key decisions
- Fork pattern instead of shared `recipes.cook` PATCH
- Admin-proxy pattern for all privileged operations (deduction, duty upsert, user list)
- Global participants modal via composable (useParticipantsModal)
- Plain-object reactive wrapping pattern (useParticipants return value)
- `generateSW` over `injectManifest` for PWA (Nuxt 4 path conflict)
- `navigateFallback: null` in Workbox to prevent Directus CMS hijack

## Key collections added
- `shopping_list_items`, `cleaning_schedule`, `push_subscriptions`, `notifications`
- Fields added: `directus_users.department`, `cook_queue.category`, `cook_queue.recipe`, `shopping_list_items.cook_date`

## Status
DONE ✅ — 2026-06-20
