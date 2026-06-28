# ItoCook — Roadmap

> This file is the big picture of the project. Small steps are in `docs/progress.md`.
> Agent reads this file at the start of each session to understand the context and not dive into details of the wrong phase.

---

## Phase 1: UI Skeleton ✅ 2026-06-02
**Goal:** can open the app, navigate through screens, see the final layout of all screens. No real data — only UI.

### M1: UI Foundation & Design System ✅
- [x] Design system — tokens, fonts, Tailwind config
- [x] iPhone frame layout (`layouts/default.vue`), Dynamic Island
- [x] Onboarding screen — flex layout, TypeScript
- [x] Auth screen — basic layout
- [x] Tailwind config full sync — all 13 tokens
- [x] Nuxt config — main.css connected

### M2: Layout & Global Navigation ✅
- [x] `components/` directory created
- [x] `BottomTabBar.vue` — 5 tabs, Phosphor icons, active/inactive
- [x] Tab bar integrated in `default.vue`, hidden on `/onboarding` and `/auth`

### M3: Core Authentication Flow ✅
- [x] auth.vue — form, validation, errors, loading state
- [x] Fake login (hardcoded user)
- [x] Redirect after login to Home
- [x] `darkStatus` — uncomment `invert` in layout
- [x] Route protection — redirect to `/auth` if not logged in

---

## Phase 2: First Live Flow ✅ 2026-06-03
**Goal:** Login works with a real backend, token is saved, basic user session is pulled from Directus.

- [x] Set up Directus SDK / HTTP client as composable (`useDirectus`)
- [x] Rewrite `useAuth` — send real POST to Directus `/auth/login` and save token in cookies
- [x] Set up global middleware to check live token via Directus (request to `/users/me`)
- [x] Display on the main page (`index.vue`) the first real data from Directus: name, email
- [x] Registration — via server proxy (admin API), User role is assigned
- [x] Set up dynamic redirect after login: if user is today's cook → Cook page, otherwise → Home

---

## Phase 3: Directus Schema Setup ✅ 2026-06-03
**Goal:** create all collections via Directus MCP before starting screen layout. Schema-first approach.

- [x] `cook_queue` collection (fields: date, cook user relation, dish name, status, category)
- [x] `orders` collection (fields: user relation, cook_queue relation, status)
- [x] `order_items` collection (fields: order relation, quantity)
- [x] `transactions` collection (fields: user relation, amount, type, description, date)
- [x] `balances` collection (fields: user relation, amount)
- [x] `recipes` collection (fields: dish_name, category, description, ingredients, steps, photo, pasta_packages, forked_from)
- [x] `app_settings` singleton (fields: pasta_package_price)
- [x] `recipe_likes` collection (fields: recipe, user)

---

## Phase 4: Feature Screens ✅ 2026-06-20
**Goal:** Final layout of all app screens according to the current screen map.
Each screen is adapted to the real data structure from Directus.
Agent reads `docs/design.md` before laying out each screen.

### Navigation (Bottom Tab Bar) ✅
- [x] Tab 1 — Home: icon `ph:cooking-pot`
- [x] Tab 2 — Kitchen: icon `ph:calendar-blank`
- [x] Tab 3 — AI Recipe: icon `ph:sparkle` (Admin → `ph:chart-bar` → Finance Page)
- [x] Tab 4 — Duty: icon `ph:broom`
- [x] Tab 5 — Common: icon `ph:users`
- [x] Tab replacement logic when Admin/Accountant logs in

### Main Screens (Tabs)

#### Tab 1 — Home ✅
- [x] Header: greeting + user name + avatar (→ Profile)
- [x] Hero block: who's cooking today + dish name + lunch status
- [x] Button "I'm having lunch" / "Skip"
- [x] Button "Become a cook" — shown only if no cook assigned for today
- [x] Lunch participant counter (X of N confirmed)
- [x] Widget: my balance (mini, tap → Profile)
- [x] Widget: upcoming kitchen duty (tap → Duty tab)
- [x] Search dish history
- [x] Office's latest dish cards — `RecipeCard.vue` with like counts

#### Tab 2 — Kitchen ✅
- [x] "Today" block: cook + dish + status + participant counter
- [x] Button "Become a cook" (if not assigned)
- [x] Weekly cook queue — slots by day
- [x] Dish history: list with search, cook name, date, like counts
- [x] "All Recipes →" link → `/recipes` page
- [ ] Weekly menu (not yet planned)
- [ ] Anonymous dish ratings (not yet implemented)

#### Tab 3 — AI Recipe (`pages/ai-recipe.vue`) ⬜
- [ ] Chat interface with AI (cooking questions only)
- [ ] Render recipe from JSON response: title, servings, time, ingredients (with emoji icons), steps
- [ ] Button "Add to recipes" → creates a draft in Kitchen
- [ ] Button "Share shopping list" → native share sheet
- [ ] Portion recalculation: input field for quantity → new request to AI with recipe context
- [ ] Ingredient substitution via AI → button "Replace in recipe"

#### Tab 4 — Duty (`pages/duty.vue`) 🟡
- [x] "On duty today" block: name + department
- [x] "Confirm duty" button — only for the assigned user
- [x] Monthly calendar — viewable by everyone, next/prev month days clickable
- [x] Schedule editing — Admin only (inline edit or modal)
- [ ] Auto-assignment by department — button for Admin

#### Tab 5 — Common (`pages/common.vue`) ⬜
- [ ] Company announcements feed (text + date, Admin creates)
- [ ] Active pool collections: name, goal (amount), collected, participants
- [ ] "Participate" button + contribution amount input
- [ ] Collection progress bar
- [ ] History of closed pool collections

### Inner Screens (No Tab)

#### Profile (`pages/profile.vue`) 🟡
- [x] Avatar, name, position, department
- [x] My List (dishes participated in) with leave confirmation + 10h rule
- [x] My Recipes (created by user, pastel colors)
- [x] Log out
- [x] Balance block: current balance + transaction history list
- [ ] Notification settings: toggle per type
- [ ] Statistics: how many times cooked, been on duty

#### Cook Page (`pages/cook.vue`) 🟡
- [x] Status: "You're the cook today" + date
- [x] Dish selection: from history or enter a new name + category
- [x] Participant counter: who confirmed + list of names
- [x] "Lunch is ready" button → status: 'ready' (decoupled from billing)
- [x] Enter receipt amount + pasta packages add-on
- [x] Auto-calculation of each participant's share and deduction preview
- [x] "Confirm deduction" button → transactions + balance updates
- [x] Cancel Cooking button (Task C) — pre-ready states only
- [x] Edit Recipe / Add Recipe in scheduled state
- [x] Balance gate — blocked if balance < -30 €
- [x] Swipe-to-dismiss bottom sheets
- [x] Upload receipt photo
- [x] Shopping list from recipe

#### All Recipes (`pages/recipes.vue`) ✅
- [x] Search + category filter
- [x] RecipeCard grid with like counts
- [x] Loading skeleton + empty state
- [x] "Cook This" button → date picker (full month) → `/cook` with prefilled dish

#### Recipe Detail (`pages/recipe/[id].vue`) 🟡
- [x] Dish photo (fullscreen hero)
- [x] Name, cook, status badge
- [x] Ingredients with emoji icons (collapsible, default open)
- [x] Join button, "Lunch is ready!" (cooking owner only)
- [x] Edit recipe (owner or entry cook)
- [x] Like button
- [x] Cooking steps display
- [x] Share shopping list button
- [ ] Ratings and reviews (anonymous)

#### Recipe Create/Edit (`pages/recipe/create.vue`) ✅
- [x] Photo upload (drag & drop / file picker / paste from clipboard)
- [x] Ingredient input with emoji preview + `AddIngredientPopover` quick-pick
- [x] Pasta packages field, category selector
- [x] `returnTo` query param support
- [x] Deferred upload + orphaned file cleanup

#### Finance Page (`pages/finance.vue`) ✅ (Admin/Accountant only)
- [x] All employee balances (color-coded)
- [x] Manual balance top-up form
- [x] Transaction history with slider pattern
- [x] Pasta package price inline edit
- [x] Low-balance restriction gate (< -30 €)

#### Notifications (`pages/notifications.vue`) ✅
- [x] Notification feed (date, type icon, text, timeAgo)
- [x] Mark as read on tap + Mark all as read button
- [x] Skeleton loading + empty state
- [ ] Quick actions from notification: "I agree", "Confirm duty"

### Reusable Components
- [x] `RecipeCard.vue`, `RecipeGridItem.vue`, `HeroBlock.vue`
- [x] `BalanceWidget.vue`, `DutyWidget.vue`, `WeekCalendar.vue`
- [x] `RecipeImageUpload.vue`, `AddIngredientPopover.vue`
- [x] `NotificationBell.vue` — bell icon with unread badge, installed on all pages

### Billing / Balance Tasks
- [x] **Task A'** — "Lunch is ready" decoupled from cost entry
- [x] **Task C** — Cook cancels entire cook_queue entry
- [x] **Task E** — Admin Finances page
- [x] **Task F** — Pasta cost in deduction
- [ ] **Task B'** — Stale cook reminder + auto-cancel → deferred
- [ ] **Task D** — Ghost participants / leave-join logic → deferred
- [ ] **Task G** — Recipe estimated_price field → low priority

---

## Phase 5: Remaining Feature Screens 🟡
**Goal:** Complete all tab screens.

- [x] Share shopping list — done via Recipe Detail
- [x] Profile balance + transaction history
- [x] Recipe Detail — cooking steps
- [ ] **AI Recipe screen** — chat UI, JSON recipe render
- [ ] **Common screen** — announcements feed, pool collections

---

## Phase 6: In-App Notifications 🟡 2026-06-22
**Goal:** business logic notifications work automatically.
No FastAPI, no email — only Directus Flows + `notifications` collection + Nuxt UI.

- [x] `notifications` collection + permissions
- [x] 4 Directus Flows: Cook Assigned, Lunch Ready, Balance Low, Morning Reminder
- [x] Utility Flow `[Util] Create Notification`
- [x] `useNotifications` composable (poll 20s) + `NotificationBell`
- [x] `/notifications` page — list, icons, timeAgo, markAsRead, markAllAsRead
- [x] Duty Reminder Flow (CRON `0 8 * * 1-5`)
- [x] Duty Assigned Flow (event on cleaning_schedule create)
- [x] Cook Cancelled Flow — notifies all users when cook cancels
- [x] Nightly Notification Cleanup Flow — deletes notifications older than 7 days at 3am
- [x] All 6 flows call FastAPI `/send-push` for push delivery
- [ ] **Step 5:** Fix status choices in Directus (add `completed` to cook_queue, `left_late`/`pending_cook_approval` to orders)
- [ ] **Step 6:** Ghost-participant logic
- [ ] **Step 7:** Notification preferences in profile

---

## Phase 6b: Deploy & PWA 🟡 2026-06-26
**Goal:** production on Hetzner VPS; PWA installable on iPhone; push notifications on mobile.

### Deploy ✅ DONE
- [x] Hetzner CX23, IP 178.104.110.253
- [x] DuckDNS — itocook.duckdns.org + cron every 5 min
- [x] `frontend/Dockerfile.prod` — multi-stage, correct `.output` path
- [x] `docker-compose.prod.yml` — 4 services, VAPID env vars
- [x] `.github/workflows/deploy.yml` — auto-deploy with `--build` flag
- [x] Server `.env` with all secrets including VAPID keys
- [x] Nginx — correct config (see `docs/nginx-itocook.conf`)
- [x] Let's Encrypt HTTPS via certbot
- [x] SSH deploy key → GitHub Secrets
- [x] Auto-deploy verified ✅
- [x] **Nginx fix 26.06.2026** — `location ~* ^(?!/cms/).*\.(js|css...)` prevents Nuxt from intercepting Directus admin JS files (was causing MIME type errors in Directus admin)

### PWA ✅ DONE
- [x] `@vite-pwa/nuxt` installed, `generateSW` strategy
- [x] Icons: `frontend/public/icons/icon-192.png` + `icon-512.png`
- [x] PWA manifest — configured in `nuxt.config.ts`
- [x] iPhone "Add to Home Screen" → standalone mode works ✅
- [x] `<link rel="manifest">` — added to `app.head` in `nuxt.config.ts`
- [x] `docker compose up -d --build` — deploy.yml uses single `--build` flag instead of separate build+up commands

### Push Notifications 🟡 MOSTLY DONE
- [x] VAPID keys in `.env`
- [x] `push_subscriptions` collection in Directus
- [x] FastAPI `/send-push` endpoint
- [x] `push-handler.js` in `frontend/app/public/`
- [x] `usePushNotifications.ts` composable
- [x] All 6 Directus Flows call `/api/send-push`
- [x] Firefox desktop ✅ works
- [x] **iPhone push** — tested and working on iPhone after PWA install
- [x] **SW on server** — confirmed working (generateSW ships in Nuxt build; iPhone & Firefox push work)
- [x] **Chrome push — wontfix** — `push service error` (FCM issue, low priority)
- [x] **Cook Cancelled Flow** — notifies all users when cook cancels
- [x] **Nightly Notification Cleanup Flow** — deletes notifications older than 7 days at 3am

> ⚠️ LESSONS LEARNED (26.06.2026):
> - NEVER use `navigateFallback` in Workbox config — it intercepts ALL requests including Directus /cms and breaks the site
> - NEVER switch SW strategy (injectManifest/generateSW) without clearing browser cache on all clients — old SW stays in cache and conflicts
> - `location = /push-handler.js { root /var/www; }` in nginx is WRONG — file is in Nuxt app/public/, not /var/www/
> - `location /admin/` and `location /assets/` blocks in nginx CONFLICT with `/cms/` — don't add them

---

## Phase 6c: Refactoring & Documentation ✅ 2026-06-28
**Goal:** Improve code quality through composable extraction, shared patterns, full JSDoc coverage, and security hardening.

### Refactoring pass
- [x] Extract `SliderList.vue` — reusable translateY slider replacing manual scroll/touch/arrow code (~140 lines removed)
- [x] Extract `useDeduction.ts` — confirmDeduction + loadPastaCost + cleanupShoppingList from cook.vue (~90 lines)
- [x] Extract `useRecipeServings.ts` — servings scaling from recipe/[id].vue (~85 lines)
- [x] Extract `ReceiptSummary.vue` — shared receipt info rows
- [x] Extract `BalanceRow.vue` + `TransactionRow.vue` — shared finance rows
- [x] Extract `utils/dates.ts` — 7 shared date functions (eliminated duplication across 8+ files)
- [x] Extend `useParticipants.participantsList` — migrated cook.vue + recipe/[id].vue off local fetchParticipants
- [x] Fix: pasta-price PATCH 500 (singleton direct PATCH fix)
- [x] Fix: cook→recipe navigation with ?cq param

### JSDoc pass
- [x] Full JSDoc on all 9 server API routes + 2 server utils
- [x] Full JSDoc on all composables (useDirectus, useAuth, useDeduction, useParticipants, useBalanceCheck, useMealCost, etc.)
- [x] Full JSDoc on all components (17 files) and pages (14 files)
- [x] Full JSDoc on all utilities, middleware, layouts
- [x] TS check — no new errors introduced

### VitePress docs site
- [x] `docs-site/` created with landing page, architecture (with Mermaid ERD), features (6 pages), screens, design system, roadmap
- [x] Build verified: `npm run docs:build` passes cleanly

### Architecture documentation
- [x] `docs/CONTEXT.md` — domain glossary with 30+ terms
- [x] `docs/ARCHITECTURE.md` — core-layer documentation, design rationale
- [x] `docs/ARCHITECTURE_Documentation.md` — high-level overview with ASCII diagram
- [x] `docs/architecture/` — 7 files: auth-flow, cook-queue, finance, recipe-system, shopping-list, duty, notifications
- [x] `docs/project-state.md` — file structure, flows, composables, security measures

### Security audit (2026-06-28)
- [x] 4 layers audited (Nuxt routes, Directus policies, nginx, auth edge cases)
- [x] 3 CRITICAL, 2 HIGH, 2 MEDIUM, 2 LOW findings documented in `docs/audits/security-audit.md`
- [x] All 11 server routes verified: protected routes call `requireAuth(event)`

### Harness / Agent infrastructure
- [x] `session-start` skill — agent reads progress+roadmap, outputs session brief
- [x] `code-reviewer` skill — agent runs checklist before saying "done"
- [x] `.planning/` structure — milestones + phases for remaining work
- [x] Self-diagnostic report — `notes/Harness/harness-overview.md` (41+ skills cataloged, 9-layer harness)
- [x] `docs/skills-cheatsheet.md` — skill reference organized by use case
- [x] Autonomous skill selection rules in AGENTS.md

---

## Phase 7: Additional Features
**Goal:** the app is convenient to use every day.

- [ ] Anonymous ratings and reviews on dishes
- [ ] AI Recipe screen (chat + recipe render)
- [ ] Common screen (announcements + pool collections)
- [ ] Receipt photo upload on Cook Page
- [ ] Task G — Recipe estimated_price field
- [ ] Weekly vote: best dish / best cook

---

## Phase 7a: Testing
**Goal:** Automated tests for critical flows before real-user test week.

- [ ] Vitest + @nuxt/test-utils setup (unit + integration patterns)
- [ ] Unit tests: composables (useAuth, useParticipants, useDeduction, useMealCost, useBalanceCheck)
- [ ] Unit tests: utils (dates, dedupRecipes, ingredientIcons)
- [ ] Component tests: key reusable components (HeroBlock, MonthCalendar, SliderList, NotificationBell)
- [ ] API integration tests: all 9 Nuxt server routes (auth required, admin-proxy, edge cases)
- [ ] E2E critical flow: auth → cook → join → deduction → balance update
- [ ] CI integration: test runner in deploy pipeline (`npm run test` before build)

---

## Phase 8: IHK Documentation + MVP Launch
**Goal:** 10 colleagues use the app for a week; IHK documentation complete.

- [ ] Test week with real users
- [ ] Collect feedback, UX fixes
- [ ] Mini guide for users
- [ ] Full access for accounting
- [ ] IHK docs: Ist-Analyse, Soll-Konzept, Wirtschaftliche Betrachtung, Gantt, Testkonzept, Fazit, UML diagrams
- [ ] Code documentation: architecture-overview.md update, inline comments, README

---

## Optional (Post-MVP)
- [ ] Receipt OCR — auto-read amount from photo
- [ ] Integration with Recipe API
- [ ] Scaling: business trips, corporate events, office purchases