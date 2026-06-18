# ItoCook — Domain Glossary

> Single source of truth for project-specific terms.
> Use this to resolve ambiguity across files and collections.
> Architecture docs: [ARCHITECTURE.md](ARCHITECTURE.md), [architecture/](architecture/)

---

## A

### app_settings
A Directus **singleton** collection holding global application constants. Currently stores `pasta_package_price` (decimal, default 1.00). Used by `useMealCost` composable to compute pasta add-on cost in deduction.

- **Files:** `frontend/server/api/settings/pasta-price.get.ts`, `frontend/server/api/settings/pasta-price.patch.ts`, `frontend/app/composables/useMealCost.ts`
- **Related:** Deduction, Pasta Package, useMealCost
- **Docs:** [finance.md](architecture/finance.md)

---

## B

### Balance
A per-user monetary account stored in the `balances` collection. One record per user, `amount` field (decimal). Can be negative (user owes money from past lunches). Admin can top up via Finance page.

- **Files:** `frontend/app/composables/useBalanceCheck.ts`, `frontend/app/components/BalanceWidget.vue`, `frontend/app/pages/finance.vue`, `frontend/app/pages/profile.vue`
- **Collections:** `balances`
- **Related:** Transaction, Deduction, Balance Gate, Finance Page
- **Docs:** [finance.md](architecture/finance.md)

### Balance Gate
A restriction that prevents a user from becoming cook or joining a meal when their balance drops below the threshold of **−30 €**. Implemented in `useBalanceCheck` composable. Checked before `assignAsCook()` in `cook.vue` and `join()` in `useParticipants.ts`.

- **Files:** `frontend/app/composables/useBalanceCheck.ts`, `frontend/app/pages/cook.vue:671`, `frontend/app/composables/useParticipants.ts:39`
- **Related:** Balance, Deduction
- **Docs:** [finance.md](architecture/finance.md)

### BottomTabBar
The persistent navigation bar at the bottom of the app (inside `layouts/app.vue`). Has 5 tabs. Tab 3 conditionally shows **Finance** (`PhChartBar`) instead of **AI Recipe** (`PhSparkle`) when the user has the finance/accountant role (checked via `isFinanceRole`).

- **Files:** `frontend/app/components/BottomTabBar.vue`, `frontend/app/layouts/app.vue`
- **Related:** isFinanceRole

---

## C

### cleaning_schedule
Directus collection for kitchen cleaning duty roster. Fields: `date`, `user` (M2O to directus_users), `department`, `confirmed` (boolean). Admin can assign/override entries. Duty page shows today's assignment + monthly calendar.

- **Files:** `frontend/app/pages/duty.vue`, `frontend/app/components/DutyWidget.vue`, `frontend/server/api/duty/confirm.post.ts`, `frontend/server/api/duty/upsert.post.ts`
- **Collections:** `cleaning_schedule`
- **Related:** Duty, MonthCalendar
- **Docs:** [duty.md](architecture/duty.md)

### confirmDeduction
Server-side action that closes a meal's financial cycle. Called from `cook.vue` `handleConfirmDeduction()` → `useDeduction.confirmDeduction()` → Nuxt server route `POST /api/deduction/confirm` (admin-proxied). Creates `transactions` and updates `balances` for each participant. Also cleans up `shopping_list_items` for the linked recipe.

- **Files:** `frontend/app/composables/useDeduction.ts:70`, `frontend/app/pages/cook.vue:878`, `frontend/server/api/deduction/confirm.post.ts`
- **Related:** Deduction, Transaction, Balance, Receipt
- **Docs:** [finance.md](architecture/finance.md)

### Cook (field)
A field on the `recipes` collection that stores the UUID of the user who owns the recipe. Set when a recipe is created or forked. Used to determine "My Recipes" on Profile page (`filter[user_created][_eq]=currentUser`).

- **Files:** `frontend/app/pages/profile.vue` (My Recipes tab), `frontend/app/pages/cook.vue` (fork logic)
- **Collections:** `recipes` → field `user_created`
- **Related:** Cook (person), Fork, Recipe
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

### Cook (person)
A user who is assigned to cook on a specific date. Represented by a `cook_queue` entry where `cook` field points to a `directus_users` record. The cook controls the meal: sets dish name, starts cooking, marks lunch ready, and enters the receipt for deduction.

- **Files:** `frontend/app/pages/cook.vue`, `frontend/app/composables/useAuth.ts` (`isTodayCook()`), `frontend/app/middleware/cook.ts`, `frontend/app/components/HeroBlock.vue`
- **Collections:** `cook_queue` → field `cook` (M2O to directus_users)
- **Related:** Cook (field), Cook Panel, cook_queue, Dish
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

### Cook Panel (Cook Page)
The page at route `/cook`. A state-machine-driven UI for the assigned cook. States: `assign` → `dish` → `scheduled` → `cooking` → `ready` → `done`. Each state shows different controls (dish name entry, start cooking, mark ready, enter receipt, confirm deduction).

- **Files:** `frontend/app/pages/cook.vue`
- **Related:** Cook (person), State Machine, confirmDeduction
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

### cook_queue
Core Directus collection representing a cooking assignment. Fields: `date`, `cook` (M2O to user), `dish_name`, `category`, `status` (scheduled/cooking/ready/completed/cancelled), `recipe` (M2O to recipes). One entry per cook per day.

- **Files:** `frontend/app/pages/cook.vue`, `frontend/app/pages/kitchen.vue`, `frontend/app/composables/useAuth.ts` (`isTodayCook()`), `frontend/app/middleware/cook.ts`, `frontend/app/components/HeroBlock.vue`
- **Collections:** `cook_queue`
- **Related:** Cook (person), State Machine, Dish
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

---

## D

### dedup
Deduplication of recipes by `dish_name`. When displaying recipe lists, only the latest fork or original is shown per dish name. Implemented in `utils/dedupRecipes.ts`.

- **Files:** `frontend/app/utils/dedupRecipes.ts`, `frontend/app/pages/index.vue:197`, `frontend/app/pages/kitchen.vue:395`, `frontend/app/pages/cook.vue:652`, `frontend/app/pages/recipes.vue:85`
- **Related:** Fork, Recipe
- **Docs:** [recipe-system.md](architecture/recipe-system.md)

### Deduction
The process of splitting a meal's total cost (receipt amount + optional pasta add-on) among all participants and updating each user's balance. Implemented in `useDeduction` composable with server-side admin-proxy for security. Each participant gets a transaction for their share.

- **Files:** `frontend/app/composables/useDeduction.ts`, `frontend/app/pages/cook.vue` (ready/done states), `frontend/server/api/deduction/confirm.post.ts`
- **Related:** confirmDeduction, Transaction, Balance, Receipt, Pasta Package
- **Docs:** [finance.md](architecture/finance.md)

### Dish
What the cook is preparing on a given day. Stored as `dish_name` on a `cook_queue` entry. May or may not have a linked `recipe`. A dish becomes a Recipe only when saved via create/edit flow.

- **Files:** `frontend/app/pages/cook.vue` (dish state), `frontend/app/components/HeroBlock.vue`, `frontend/app/pages/kitchen.vue`
- **Collections:** `cook_queue` → field `dish_name`
- **Related:** Recipe, Cook (person), cook_queue
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

### Duty
A scheduled kitchen cleaning assignment. Stored in `cleaning_schedule` collection. Each entry has a `date`, `user`, `department`, and `confirmed` flag. Users can confirm their own duty. Admin can edit all entries.

- **Files:** `frontend/app/pages/duty.vue`, `frontend/app/components/DutyWidget.vue`, `frontend/app/components/MonthCalendar.vue`, `frontend/server/api/duty/confirm.post.ts`, `frontend/server/api/duty/upsert.post.ts`
- **Collections:** `cleaning_schedule`
- **Related:** cleaning_schedule, MonthCalendar
- **Docs:** [duty.md](architecture/duty.md)

---

## F

### Finance Page
Admin-only page at `/finance` (replaces AI Recipe tab for finance role users). Shows all user balances with color coding, manual top-up form, transaction history, and pasta package price editor.

- **Files:** `frontend/app/pages/finance.vue`, `frontend/app/components/BalanceRow.vue`, `frontend/app/components/TransactionRow.vue`
- **Related:** Balance, Transaction, isFinanceRole
- **Docs:** [finance.md](architecture/finance.md)

### Fork
A pattern where a user cooks another user's recipe: the system creates a copy of the original recipe owned by the current cook. The copy has `forked_from` pointing to the original recipe ID. On repeat cooking, the existing fork is reused instead of creating another copy.

- **Files:** `frontend/app/pages/cook.vue:762-795`, `frontend/app/pages/profile.vue` (My Recipes)
- **Collections:** `recipes` → field `forked_from`
- **Related:** Recipe, Cook (person), Cook (field)
- **Docs:** [recipe-system.md](architecture/recipe-system.md)

---

## G

### Ghost Participant
A user who has joined a meal (has a `confirmed` order) but did not cancel before the 1-hour cutoff or did not show up. The billing logic still deducts their share because the cost was already split. Not yet implemented; deferred to Phase 6 (Task D). Future logic: <1h leave triggers penalty charge, cook must approve late joins.

- **Files:** `docs/roadmap.md` (Task D), `docs/progress.md`
- **Related:** Order, Participant, Deduction, Balance Gate

---

## H

### HeroBlock
The "Who's cooking today?" UI component used on Home (`index.vue`) and Kitchen (`kitchen.vue`) pages. Has 3 visual states: **loading** (skeleton), **cook** (dish name, category image, cook avatar, status, participant count), **empty** (CTA to become cook). Also shows fallback `chef-cook.png` when queue entry has no linked recipe.

- **Files:** `frontend/app/components/HeroBlock.vue`, `frontend/app/pages/index.vue`, `frontend/app/pages/kitchen.vue`
- **Related:** Cook (person), cook_queue
- **Docs:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## I

### isFinanceRole
A computed boolean that checks if the current user's role UUID matches the finance/accountant role. Controls whether the BottomTabBar shows the Finance tab (instead of AI Recipe). Role UUID is hardcoded in `BottomTabBar.vue`.

- **Files:** `frontend/app/components/BottomTabBar.vue`
- **Related:** BottomTabBar, Finance Page

---

## M

### MonthCalendar
Reusable component extracted from `duty.vue`. Renders a grid of weekday cells (Mon-Fri) with state indicators (today, has entry, current user, confirmed, past). Supports prev/next month navigation. Also reused in `recipe/[id].vue` for the date picker bottom-sheet.

- **Files:** `frontend/app/components/MonthCalendar.vue`, `frontend/app/pages/duty.vue`, `frontend/app/pages/recipe/[id].vue`
- **Related:** Duty, cleaning_schedule
- **Docs:** [duty.md](architecture/duty.md)

---

## O

### Order
A record in the `orders` collection representing a user's commitment to participate in a meal. NOT a restaurant order — it's a join/leave record. Fields: `user` (M2O), `cook_queue` (M2O), `status` (confirmed). The cook auto-gets an order when assigned as cook.

- **Files:** `frontend/app/composables/useParticipants.ts`, `frontend/app/pages/recipe/[id].vue` (Join button), `frontend/app/pages/profile.vue` (My List)
- **Collections:** `orders`
- **Related:** Participant, cook_queue, Ghost Participant
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

---

## P

### Participant
A user who has joined a meal via a `confirmed` `orders` entry. The participant list drives cost splitting in deduction and shows in cook panel, recipe detail, and hero block.

- **Files:** `frontend/app/composables/useParticipants.ts`, `frontend/app/pages/cook.vue` (participants section), `frontend/app/pages/recipe/[id].vue`
- **Collections:** `orders` (filtered by `status: confirmed` and `cook_queue`)
- **Related:** Order, Deduction, Balance Gate
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

### Pasta Package
An integer field on `recipes` (`pasta_packages`) that tracks how many packages of pasta were used. Also can be derived from ingredients array (entry with name "pasta"). The cost is computed as `packages × pasta_package_price` (from `app_settings`). Shown as a separate line in receipt preview.

- **Files:** `frontend/app/composables/useDeduction.ts` (`loadPastaCost`), `frontend/app/composables/useMealCost.ts`, `frontend/app/components/ReceiptSummary.vue`, `frontend/app/pages/recipe/create.vue`
- **Collections:** `recipes` → field `pasta_packages`, `app_settings` → field `pasta_package_price`
- **Related:** Deduction, app_settings
- **Docs:** [finance.md](architecture/finance.md)

---

## R

### Receipt
The total cost of ingredients for a meal, entered by the cook in the `ready` state. A number in euros. Combined with pasta cost to form the grand total, then split equally among participants. Not stored as a file upload yet (planned for Phase 7).

- **Files:** `frontend/app/pages/cook.vue:340-351` (receipt input), `frontend/app/components/ReceiptSummary.vue`
- **Related:** Deduction, confirmDeduction, Pasta Package
- **Docs:** [finance.md](architecture/finance.md)

### Recipe
A reusable dish definition stored in the `recipes` collection. Fields: `dish_name`, `category`, `description`, `ingredients` (JSON array), `steps` (JSON array), `photo` (file UUID), `pasta_packages`, `servings`, `forked_from`. Distinguished from "Dish" — a recipe is a saved template; a dish is what the cook prepares on a given day.

- **Files:** `frontend/app/pages/recipe/[id].vue`, `frontend/app/pages/recipe/create.vue`, `frontend/app/pages/recipes.vue`, `frontend/app/pages/cook.vue`, `frontend/app/pages/index.vue`, `frontend/app/pages/kitchen.vue`, `frontend/app/composables/useRecipeImage.ts`
- **Collections:** `recipes`, `recipe_likes`
- **Related:** Dish, Fork, Pasta Package, Cook (field)
- **Docs:** [recipe-system.md](architecture/recipe-system.md)

### recipe_likes
Junction collection tracking which users liked which recipes. Used for like counts on recipe cards and heart toggle on recipe detail. Fields: `recipe` (M2O to recipes), `user` (M2O to directus_users).

- **Files:** `frontend/app/pages/recipe/[id].vue`, `frontend/app/pages/index.vue`, `frontend/app/pages/kitchen.vue`, `frontend/app/pages/recipes.vue`
- **Collections:** `recipe_likes`
- **Related:** Recipe
- **Docs:** [recipe-system.md](architecture/recipe-system.md)

---

## S

### shopping_list_items
Collection for per-user shopping list entries. Fields: `user` (M2O), `recipe` (M2O), `recipe_name`, `ingredient_name`, `amount`, `unit`, `emoji`, `is_checked`, `sort`, `cook_date`. Items are auto-deleted on deduction or cancel cooking.

- **Files:** `frontend/app/pages/shopping-list.vue`, `frontend/app/components/ShoppingListWidget.vue`, `frontend/app/composables/useDeduction.ts` (`cleanupShoppingList`), `frontend/app/pages/cook.vue` (`cancelCooking`)
- **Collections:** `shopping_list_items`
- **Related:** Order, Deduction
- **Docs:** [shopping-list.md](architecture/shopping-list.md)

### State Machine
The cook_queue lifecycle implemented as a computed `state` in `cook.vue:579-587`. States: `loading` → `assign` → `dish` → `scheduled` → `cooking` → `ready` → `done`. Each state renders a distinct UI section. Transitions are triggered by user actions (assignAsCook, saveDish, startCooking, markReady, confirmDeduction).

- **Files:** `frontend/app/pages/cook.vue:579-599` (state computed + pageTitle)
- **Related:** Cook Panel, cook_queue, confirmDeduction
- **Docs:** [cook-queue.md](architecture/cook-queue.md)

---

## T

### Transaction
A financial record in the `transactions` collection. Created either by admin top-up (positive amount) or by deduction (negative amount per participant). Each participant gets one transaction when deduction is confirmed. Fields: `user`, `amount`, `type`, `description`, `date`.

- **Files:** `frontend/app/pages/finance.vue`, `frontend/app/pages/profile.vue`, `frontend/server/api/deduction/confirm.post.ts`
- **Collections:** `transactions`
- **Related:** Balance, Deduction, Finance Page
- **Docs:** [finance.md](architecture/finance.md)

---

## U

### useDirectus
The core composable that wraps `fetch` for all Directus API communication. Manages `directus_token` cookie, attaches `Authorization: Bearer` header, handles response parsing. All data requests flow through this single composable.

- **Files:** `frontend/app/composables/useDirectus.ts`
- **Related:** useAuth, Server Proxy
- **Docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (Core layer section)

### useAuth
Authentication composable providing `login`, `signUp`, `logout`, `fetchUser`, `isTodayCook`. Depends on `useDirectus`. Stores user object in `useState('auth:user')`.

- **Files:** `frontend/app/composables/useAuth.ts`
- **Related:** useDirectus, Cook (person)
- **Docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (Auth layer section)

### useDeduction
Composable extracted from `cook.vue` during refactoring. Provides `confirmDeduction`, `loadPastaCost`, and `cleanupShoppingList`. Manages `deducting`, `pastaCost`, and `pastaBreakdown` refs.

- **Files:** `frontend/app/composables/useDeduction.ts`
- **Related:** Deduction, confirmDeduction, Pasta Package
- **Docs:** [finance.md](architecture/finance.md)

### useParticipants
Composable managing meal participant state. Provides `participantsList`, `confirmed` count, `hasJoined`, `join()`, `fetch()`. Initialized with `cookQueueId` ref. Returns a plain object (must be wrapped with `reactive()` in templates).

- **Files:** `frontend/app/composables/useParticipants.ts`
- **Related:** Order, Participant, useParticipantsModal
- **Docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (Participants section)

### useParticipantsModal
Global composable for the participant list modal overlay. Module-level refs managed in `layouts/app.vue`. Opened by emitting `@show-participants` from HeroBlock on any page. Modal is teleported inside the phone frame, not to `body`.

- **Files:** `frontend/app/composables/useParticipantsModal.ts`, `frontend/app/layouts/app.vue`
- **Related:** Participant, useParticipants

### Server Proxy
A Nuxt server route (in `frontend/server/`) that proxies admin-privileged requests from the browser to Directus without exposing admin credentials. Examples: `POST /api/auth/signup`, `POST /api/deduction/confirm`, `PATCH /api/duty/upsert`. Uses cached admin token via `getAdminToken()` utility.

- **Files:** `frontend/server/api/auth/signup.post.ts`, `frontend/server/api/deduction/confirm.post.ts`, `frontend/server/api/duty/confirm.post.ts`, `frontend/server/api/duty/upsert.post.ts`, `frontend/server/utils/adminToken.ts`, `frontend/server/utils/auth.ts`
- **Related:** useDirectus, confirmDeduction
- **Docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (Signup Proxy, Admin Token sections)
