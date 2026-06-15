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

## Phase 4: Feature Screens 🟡 (in progress)
**Goal:** Final layout of all app screens according to the current screen map.
Each screen is adapted to the real data structure from Directus.
Agent reads `docs/design.md` before laying out each screen.

---

### Navigation (Bottom Tab Bar) ✅
- [x] Tab 1 — Home: icon `ph:cooking-pot`
- [x] Tab 2 — Kitchen: icon `ph:calendar-blank`
- [x] Tab 3 — AI Recipe: icon `ph:sparkle` (Admin → `ph:chart-bar` → Finance Page)
- [x] Tab 4 — Duty: icon `ph:broom`
- [x] Tab 5 — Common: icon `ph:users`
- [x] Tab replacement logic when Admin/Accountant logs in

---

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
- [ ] Weekly menu (if planned by cook in advance)
- [ ] Anonymous dish ratings (stars + text)

#### Tab 3 — AI Recipe (`pages/ai-recipe.vue`) ⬜
- [ ] Chat interface with AI (cooking questions only)
- [ ] Render recipe from JSON response: title, servings, time, ingredients (with emoji icons), steps
- [ ] Button "Add to recipes" → creates a draft in Kitchen
- [ ] Button "Share shopping list" → native share sheet
- [ ] Portion recalculation: input field for quantity → new request to AI with recipe context
- [ ] Ingredient substitution via AI → button "Replace in recipe"
- [ ] Uses `AddIngredientPopover.vue` for ingredient selection (already built)

#### Tab 4 — Duty (`pages/duty.vue`) ⬜
- [ ] "On duty today" block: name + department
- [ ] "Confirm duty" button — only for the assigned user
- [ ] Monthly calendar — viewable by everyone
- [ ] Schedule editing — Admin only (inline edit or modal)
- [ ] Auto-assignment by department — button for Admin
- [ ] Notifications to assigned users (trigger from Directus Flow)

#### Tab 5 — Common (`pages/common.vue`) ⬜
- [ ] Company announcements feed (text + date, Admin creates)
- [ ] Active pool collections: name, goal (amount), collected, participants
- [ ] "Participate" button + contribution amount input
- [ ] Collection progress bar
- [ ] History of closed pool collections
- [ ] Create a pool collection — Admin or anyone (configurable)
- [ ] Weekly vote: best dish / cook (optional, Phase 7)

---

### Inner Screens (No Tab)

#### Profile (`pages/profile.vue`) 🟡
- [x] Avatar, name, position, department
- [x] My List (dishes participated in) with leave confirmation + 10h rule
- [x] My Recipes (created by user, pastel colors)
- [x] Log out
- [ ] Balance block: current balance + transaction history list
- [ ] Notification settings: push / email / WhatsApp (toggle)
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
- [ ] Upload receipt photo
- [ ] Shopping list from recipe

#### All Recipes (`pages/recipes.vue`) ✅
- [x] Search + category filter
- [x] RecipeCard grid with like counts
- [x] Loading skeleton + empty state
- [x] "Cook This" button → date picker → `/cook` with prefilled dish

#### Recipe Detail (`pages/recipe/[id].vue`) 🟡
- [x] Dish photo (fullscreen hero, object-cover for uploads / object-contain for demos)
- [x] Name, cook, status badge (scheduled / cooking / ready / cancelled)
- [x] Ingredients with emoji icons (collapsible, default open)
- [x] Join button (scheduled/cooking only), "Lunch is ready!" (cooking owner only)
- [x] Edit recipe (owner or entry cook)
- [x] Like button
- [ ] Cooking steps display
- [ ] Share shopping list button (share ingredients via native share sheet)
- [ ] Ratings and reviews (anonymous)

#### Recipe Create/Edit (`pages/recipe/create.vue`) ✅
- [x] Photo upload (drag & drop / file picker / paste from clipboard)
- [x] Client-side image resize (max 1200px, JPEG 0.85, max 5MB)
- [x] Ingredient input with emoji preview + `AddIngredientPopover` quick-pick
- [x] Ingredient unit selector (g/kg/ml/l/pcs/tbsp/tsp/bunch/to taste)
- [x] Pasta packages field
- [x] Category selector (Salad / Soup / Pasta / Meat / Fish / Vegan / Pizza)
- [x] `returnTo` query param support (returns to cook page after save)
- [x] Prefill from history by name (via `?name=` param)
- [x] Deferred upload + orphaned file cleanup on save failure / edit

#### Finance Page (`pages/finance.vue`) ✅ (Admin/Accountant only)
- [x] All employee balances (color-coded: default / mild red / strong red)
- [x] Manual balance top-up form (user + amount + note)
- [x] Transaction history (last 50, slider pattern with up/down arrows + "Show all")
- [x] Pasta package price inline edit
- [x] Low-balance restriction gate (< -30 €) via `useBalanceCheck`

#### Notifications (`pages/notifications.vue`) ⬜
- [ ] Notification feed (date, type, text)
- [ ] Quick actions from notification: "I agree", "Confirm duty"
- [ ] Mark all as read

---

### Reusable Components
- [x] `RecipeCard.vue` — dish card (photo, name, cook, like count)
- [x] `RecipeGridItem.vue` — grid variant with reactive image
- [x] `HeroBlock.vue` — "who's cooking today" block (Home + Kitchen), 3 states
- [x] `BalanceWidget.vue` — mini balance with tiered color coding
- [x] `DutyWidget.vue` — upcoming duty widget
- [x] `WeekCalendar.vue` — horizontal week pills, dot indicators, week navigation
- [x] `RecipeImageUpload.vue` — file picker / drag & drop / paste, canvas resize
- [x] `AddIngredientPopover.vue` — bottom-sheet with categorized ingredient grid + emoji icons
- [ ] `CategoryPill.vue` — category / filter pill
- [ ] `ParticipantCounter.vue` — lunch participant counter

---

### Billing / Balance Tasks
- [x] **Task A'** — "Lunch is ready" decoupled from cost entry; receipt form in 'ready' state; overdue badge after 14:00
- [x] **Task C** — Cook cancels entire cook_queue entry; all orders deleted; no transactions touched
- [x] **Task E** — Admin Finances page: balances overview, manual top-up, transaction history, pasta price setting
- [x] **Task F** — Recipe pasta_packages field + app_settings singleton + useMealCost composable; pasta cost in deduction
- [ ] **Task B'** — Reminder for overdue cost entry; auto-expire of stale cook_queue entries → **deferred to Phase 6 (Notifications)**
- [ ] **Task D** — Ghost participants / leave-join logic with <10h/<1h thresholds; cook approval flow → **deferred to Phase 6 (Notifications)**
- [ ] **Task G** — Recipe estimated_price field (optional, non-blocking) → **deferred, low priority**

---

## Phase 5: Remaining Feature Screens 🟡
**Goal:** Complete all tab screens, add shopping list export, finish Profile balance view.

- [ ] **Share shopping list** — `navigator.share()` with ingredient list as text; button on Recipe Detail and AI Recipe; no backend needed
- [ ] **Profile balance + transaction history** — fetch from `balances` + `transactions` collections; show current balance + list (date, description, ±amount, color-coded)
- [ ] **Recipe Detail — cooking steps** — steps already stored in DB; render below ingredients
- [ ] **AI Recipe screen** — chat UI, JSON recipe render with emoji ingredients, "Add to recipes" / "Share list" buttons
- [ ] **Duty screen** — monthly calendar, "Confirm duty", Admin edit + auto-assignment
- [ ] **Common screen** — announcements feed, pool collections with progress bars

---

## Phase 6: FastAPI + Notifications
**Goal:** business logic notifications work automatically; ghost-participant billing logic added.

- [ ] Directus Flows for email: "cook assigned", "lunch ready", morning reminder
- [ ] FastAPI endpoint: trigger notifications (email)
- [ ] Morning reminder if no cook is assigned (8:00–10:00)
- [ ] "Lunch ready" notification to participants
- [ ] Alert for negative balance (< −10 €)
- [ ] Kitchen duty reminder
- [ ] **Task B'** — Reminder for cook with stale scheduled entry; auto-expire after threshold
- [ ] **Task D** — Ghost-participant logic: <1h leave penalty, cook approval for late join/leave; deferred-charge on confirmDeduction

---

## Phase 7: Additional Features
**Goal:** the app is convenient to use every day, with financial control.

- [ ] Anonymous ratings and reviews on dishes
- [ ] Recalculate recipe for a new number of participants (AI)
- [ ] Shopping list — from recipe / manually, export
- [ ] Receipt photo upload on Cook Page
- [ ] Task G — Recipe estimated_price field
- [ ] Weekly vote: best dish / best cook

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
- [ ] Add products from receipt to database
- [ ] Integration with Recipe API
- [ ] Scaling: business trips, corporate events, office purchases
- [ ] PWA manifest + mobile browser safe areas
- [ ] Staging deployment on Hetzner VPS