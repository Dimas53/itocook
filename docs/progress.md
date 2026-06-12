# ItoCook — Progress Log

## Current status
- [x] **Architecture overview** — `notes/architecture-overview.md` (full structural analysis)
- [x] **Code walkthrough** — `notes/itocook-full-overview.md` (step-by-step code tour)
- [x] **Directus API comments** — added `// directus api` comments to all call sites
- [x] Project structure set up (frontend/, api/, directus/)
- [x] Docker running (Nuxt + Directus + PostgreSQL)
- [x] iPhone frame layout, Onboarding, Auth, Tailwind, Jost, Phosphor Icons
- [x] Auth — real Directus signUp/login/logout, form validation, password toggle, middleware
- [x] Nuxt 4 app/ directory structure migrated
- [x] 5 Directus collections (cook_queue, orders, order_items, transactions, balances)
- [x] `recipes` collection with read/create/update/delete for User role
- [x] 4 seed recipes (Caesar Salad, Spaghetti Carbonara, Tomato Soup, Grilled Salmon)
- [x] All screens: Home, Profile, Kitchen, Cook Panel, Recipe Detail, Recipe Create/Edit
- [x] BottomTabBar with 5 tabs, app layout with iPhone frame, Dynamic Island
- [x] HeroBlock.vue — 3 states (loading/cook/empty), links to recipe
- [x] RecipeCard.vue — skeleton, category badge, dish image via `useRecipeImage`
- [x] WeekCalendar.vue — horizontal week pills, dot indicators, week navigation
- [x] BalanceWidget.vue, DutyWidget.vue
- [x] `useRecipeImage` composable — photo or category fallback PNG
- [x] `useParticipants` composable — shared participant count, hasJoined, join()
- [x] `useDirectus` composable — HTTP client
- [x] `useAuth` composable — signUp, login, logout, fetchUser, isTodayCook
- [x] **Fix: auto-redirect removed from auth.vue** — login always redirects to `/` (never `/cook`)
- [x] **Fix: Calendar → HeroBlock sync in kitchen.vue** — hero derives from selectedSlot reactively; recipeId + category fetched via watch on selectedSlot; participants fetched per selected day
- [x] **Fix: Recipe detail conditional Join** — `recipe/[id].vue` auto-discovers active cook_queue entries by dish_name; Join button only visible when active entry exists
- [x] **Fix: RecipeCard missing images** — `photo` field in Recipe interface; `<img>` tag with `useRecipeImage` in template; `photo` field passed from `index.vue` mapping
- [x] **Fix: Cook Panel eye icon** — "Edit" link replaced with eye icon button navigating to `/recipe/[id]` (view only) in `cook.vue`
- [x] **Fix: Ingredients default open** — `showIngredients` changed to `ref(true)` in `recipe/[id].vue`
- [x] **Fix: Extended edit permission** — `canEdit` computed in `recipe/[id].vue`: edit button visible if recipe owner OR today's cook with linked queue entry
- [x] **Fix: Status-based bottom controls** — `recipe/[id].vue` shows badges per queue status: "Scheduled for [date]", "Cooking in progress", "Lunch is ready!", "Cancelled"; Join button only for scheduled/cooking; "Lunch is ready!" only for cooking owner
- [x] **Fix: Calendar today highlight** — `WeekCalendar.vue` today (not selected) uses `bg-purple-100 text-purple-700` instead of plain white
- [x] **Task A': Split "Lunch is ready" from cost entry** — `markReady()` only sets `status: 'ready'` (no longer auto-transitions to receipt step); receipt form is shown in the `'ready'` state itself, accessible independently; overdue badge appears when past 14:00 same day; `confirmDeduction()` unchanged (split logic preserved, sets status to `'completed'`)
- [x] **Task C: Cook cancels cook_queue entry** — "Cancel Cooking" button appears in `dish`/`scheduled`/`cooking` states (not in `ready`/`done`); confirmation dialog before action; on confirm: PATCH `cook_queue → status: 'cancelled'`, DELETE all related confirmed orders, navigate to `/kitchen`; no balances/transactions touched
- [x] **Fix: hardcoded totalCount** — replaced `ref(8)` in `index.vue` and `kitchen.vue` with `useTotalUsers()` composable via Nuxt server route `/api/users/count` (admin-proxied to Directus `/users` endpoint). Fixes 403 on `/items/directus_users` for authenticated users. Verified: all 3 users have `status: "active"`; `/users?aggregate[count]=*&filter[status][_eq]=active` returns `{"data":[{"count":"3"}]}` (string, not object); parsing uses `parseInt(raw, 10)`.
- [x] **Fix: missing dutyLoading ref** — `const dutyLoading = ref(true)` was accidentally removed from `index.vue`; added back. Fixes Vue warning "Property 'dutyLoading' was accessed during render but is not defined on instance".
- [x] **Fix: naming collision in useTotalUsers.ts** — inner function named `fetch()` shadowed global `fetch`, causing `fetch('/api/users/count')` to call itself recursively → caught → `count.value = 0`. Renamed to `fetchCount`; callers unaffected (both destructure only `{ count: totalCount }`).
- [x] **Task F: Recipe pasta/inventory field** — added `pasta_packages` (integer, nullable) to `recipes` collection; created `app_settings` singleton with `pasta_package_price` (decimal, default 1.00); added number input in recipe create/edit form; created Nuxt server route `GET /api/settings/pasta-price` (admin proxy); created `useMealCost()` composable for computation; integrated pasta cost into `confirmDeduction()` — added to total before split, displayed as separate line in receipt preview and deduction breakdown; kept generic enough for future inventory items.
- [x] **Recipe photo upload** — replaced URL text input in `recipe/create.vue` with `RecipeImageUpload` component (file picker / drag & drop / paste from clipboard); client-side resize via canvas (max 1200px, JPEG quality 0.85, max 5MB); uploads to Directus Files (`recipe-photos` folder); stores file UUID in `recipes.photo` field. Added `uploadFile()` to `useDirectus.ts`. Refactored `useRecipeImage` to return `{ src, isUploaded }` object — UUIDs resolved to Directus asset URL. `RecipeCard.vue` and `HeroBlock.vue` show circular thumbnail (68–72px, rounded-full, border-white) for uploaded photos; demo category PNGs keep full-width display. Created `directus_files` create+read permissions for the User policy.

## Known issues
- **Phase 4 screens** — AI Recipe, Duty, Common, Recipe Detail, Finance, Notifications all stubs or unfinished
- **Cook Page balance deduction** — uses user token directly, may need Directus permissions or server proxy for /items/balances and /items/transactions on behalf of other users

## Fixes — current session
- [x] **Fix: Safe area top inset (attempt 4)** — `app.vue` layout: status bar wrapper now has `bg-white` and `padding-top: env(safe-area-inset-top, 44px)`; content padding changed from `calc(60px + env(..., 0px))` to `calc(48px + env(..., 44px))`. Creates a persistent opaque top bar with solid background, preventing content from scrolling under it.
- [x] **Fix: Layout assignment** — `default.vue` reverted to transparent status bar (no white backdrop, no extra padding-top); `auth.vue` and `onboarding.vue` now explicitly set `layout: 'default'`. All 12 pages now have explicit layout assignments (recipe/today.vue was an empty stub and has been removed).
- [x] **Fix: HeroBlock Cook button (attempt 2)** — replaced `@click="$emit('become-cook')"` with `@click="onBecomeCook"` JS guard that checks `if (props.cook) return` before emitting. `:disabled` attr alone wasn't reliably blocking navigation in all cases.
- [x] **Chore: Remove empty recipe/today.vue** — file was a 6-line stub with no content, moved to notes/deleted/.
- [x] **UX: Cook page two-button dish selection** — `cook.vue` now has two-button layout in 'dish' state: (1) "Add to Schedule" single button when `dishName` matches recipe history via `_icontains`; (2) two buttons ("Add to Schedule" + "Create Recipe & Add to Schedule") when no match; "Create Recipe & Add to Schedule" navigates to `/recipe/create?returnTo=...` and returns with `newRecipe` param to auto-link; `recipe/create.vue` supports `returnTo` query param for navigating back after save
- [x] **UX: Status-based bottom controls** — `recipe/[id].vue` shows badges per queue status; Join only for `scheduled`/`cooking`; "Lunch is ready!" only for cooking owner
- [x] **UX: Calendar today highlight** — today's non-selected cell gets `bg-purple-100 text-purple-700`
- [x] **UX: Cook page status refresh** — `visibilitychange` listener re-fetches cook entry data when page becomes visible; status syncs with admin changes
- [x] **UX: HeroBlock Cook button date fix** — `@go-to-cook` passes `?date=` param instead of bare `/cook`
- [x] **UX: Cooking pot status icon** — recipe/[id].vue header shows `PhCookingPot` in status color when queue entry linked; `PhClock` added to scheduled badge
- [x] **UX: Profile My List** — dishes user participated in; red X → confirmation with 10h rule → delete order from DB; darker bg + "You are the cook" when user is cook
- [x] **UX: Profile My Recipes** — recipes created by user; items use random pastel colors from design palette

## Fixes — second session
- [x] **Bug: Recipe page heart hidden** — reverted cooking pot from header to bottom controls section; `PhHeart` restored unconditionally in top right corner;
- [x] **Bug: Cook page status mismatch** — `scheduled` and `cooking` split into separate states in `cook.vue` state machine; added `scheduled` template with "Start Cooking" button that sets status to `cooking`; `pageTitle` reflects correct state
- [x] **Bug: HeroBlock Cook redirects to home** — middleware `_nin` filter format fixed from single string to proper `_nin[]` array via `URLSearchParams.append`; cook middleware now correctly queries non-cancelled entries
- [x] **Bug: Profile My List empty on first load** — `onMounted` added to call `fetchMyOrders()` on initial page load; `switchTab` changed from lazy (`length === 0` guard) to always-fetch on tab switch
- [x] **Bug: Confirm dialog outside phone frame** — `Teleport to="body"` removed from profile.vue; fixed overlay rendered inside the `app` layout scope
- [x] **Bug: DELETE response JSON parse crash** — `useDirectus.ts` changed from `res.json()` to `res.text()` + conditional `JSON.parse`; handles 204 No Content (empty body from DELETE) without crashing
- [x] **UX: Cook X button → kitchen** — `router.push('/')` changed to `router.push('/kitchen')` in cook.vue
- [x] **UX: saveDish status by date** — today dish → status=`cooking`, future dish → status=`scheduled`; button text changes dynamically ("Start Cooking" / "Add to Schedule")
- [x] **UX: Unified status template** — recipe/[id].vue bottom controls: single dynamic template; icon/circle/text changes by status (`PhClock`/`PhCookingPot`/`PhCheckCircle`/`PhXCircle`); participants count always visible; Join/Start/Ready buttons adapt to status and ownership
- [x] **Bug: Admin can edit any recipe** — `canEdit` now checks `isEntryCook` (specific queue entry cook) instead of `isCurrentUserTodayCook` (any cook today); removed `fetchIsTodayCook` call from recipe page entirely
- [x] **Bug: _nin format in useAuth** — same fix as middleware: `URLSearchParams` single string → proper `_nin[]` array
- [x] **UX: Auto-join for cook** — `assignAsCook()` in cook.vue creates a `confirmed` order for the cook; cook appears in participants automatically; Join button shows as joined for the cook
- [x] **UX: Recipe ownership on cook** — `saveDish()` in cook.vue updates recipe's `cook` field to current user after matching; recipe appears in their "My Recipes" and shows their avatar
- [x] **UX: Recent Dishes grid** — home page switched to `grid grid-cols-2 gap-3`; RecipeCard redesigned: title → chef → rating → small image, no button, no category

## Fixes — third session
- [x] **Bug: Orphaned orders in Profile My List** — when a `cook_queue` entry is deleted from admin, linked `orders` entries with null FK no longer render (API filter `_nnull`); clicking "X" on an orphaned card deletes the order directly by ID, skipping the modal flow

## Fixes — fourth session
- [x] **Feat: HeroBlock fallback image** — `chef-cook.png` when queue entry has no linked recipe; "Chef is thinking..." placeholder text
- [x] **Rework: Fork on cook** — replaced shared `recipes.cook` PATCH + `cooked_recipes` junction with fork pattern. When user cooks another's recipe, a fork (copy with `forked_from` pointer, owned by cook) is created. `recipes.update` permission restored to `user_created Equals $CURRENT_USER`. Reuses existing fork on repeat. "My Recipes" back to simple `filter[user_created]` query.

## Fixes — fifth session
- [x] **UX: Schedule button for today** — `cook.vue` dish state shows single "Start Cooking" button when date is today (via `isToday` computed), immediately transitions to `cooking` state; existing two-button layout preserved for future dates
- [x] **UX: Author attribution in history picker** — `cook.vue` "Or pick from history" now displays `by <author> · <date>` beneath each recipe name; `fetchPastDishes()` fetches `cook.id,cook.first_name,cook.last_name,date_created` and maps to `cookName`/`dateLabel`
- [x] **Fix: Safe area top inset (attempt 3, superseded)** — `app.vue` content area uses `padding-top: calc(60px + env(safe-area-inset-top, 0px))`; `nuxt.config.ts` viewport meta updated to `viewport-fit=cover`.
- [x] **UX: HeroBlock empty-state CTA** — `HeroBlock.vue` shows centered empty-state ("No one's cooking yet — Be today's chef!") with "I'm cooking today!" CTA when `cook` is null; existing content preserved when a cook is assigned

## Fixes — sixth session
- [x] **Fix: folder upload** — `POST /files` folder field unreliable; added `PATCH /files/{id}` fallback in `uploadFile()` to ensure `recipe-photos` folder assigned
- [x] **Fix: deferred upload** — `RecipeImageUpload` emits resized File blob via `selected` event instead of uploading immediately; parent `recipe/create.vue` uploads on `submitRecipe()`; orphaned files eliminated
- [x] **Fix: cleanup on preview clear** — added `deleteFile(id)` to `useDirectus.ts` for deleting previously uploaded files
- [x] **Fix: HeroBlock photo priority** — `kitchen.vue` now fetches `photo` field from matching recipe and passes it in `heroCook`; uploaded recipe photo takes priority over category demo image
- [x] **Fix: recipe detail hero image** — uploaded photos use `object-cover` (fill container) while demo images keep `object-contain` (fit inside)
- [x] **Fix: duplicate onMounted in RecipeImageUpload** — consolidated paste listener into single `onMounted`
- [x] **Fix: TS paste handler** — `item.getAsFile()` guarded by null check

## Next session — plan

### Phase 4: Feature Screens
**Goal:** Final layout of all screens according to the current screen map.

- [x] Navigation (BottomTabBar), Home, HeroBlock, RecipeCard, BalanceWidget, DutyWidget
- [x] Kitchen screen, Cook Page, Recipe Detail
- [x] Task A': Split "Lunch is ready" from cost entry — decoupled into independent steps
- [x] Task C: Cook cancels cook_queue entry — cancel button + confirm dialog in pre-ready states
- [ ] Task B': Reminder mechanism for overdue cost entry (groundwork)
- [ ] Task D: Ghost participants / leave-join logic
- [x] Task F: Pasta/inventory logic
- [ ] AI Recipe — chat with AI, JSON recipe render, serving recalculation
- [ ] Duty screen — duty calendar, confirmation, auto-assignment
- [ ] Common screen — group purchases, announcements, polls
- [ ] Finance page — balance table, alerts, history, report
- [ ] Notifications — feed, quick actions
- [ ] Shopping list from recipe, Receipt photo upload

## Git log
- `3ae6859` — feat(cook): split lunch-ready from receipt entry (Task A')
- `10cd5b6` — feat(cook): cancel cooking, fix naming collision in useTotalUsers, replace hardcoded user count
- `04fc50f` — feat(recipe): add pasta_packages field and pasta cost in deduction (Task F); fix(kitchen): remove redundant become-cook button under calendar
- `04fc50f` — feat(recipe): add pasta_packages field and pasta cost in deduction (Task F); fix(kitchen): remove redundant become-cook button under calendar
- `d695b45` — fix(hero): add JS guard on Cook button — disabled attr alone wasn't reliable; remove invert class from status bar as intended
- `14e2c08` — fix(hero): guard HeroBlock Cook button with JS check — disabled attr alone wasn't blocking navigation
- `bf2f2bd` — fix(layout): safe-area top bar on app layout, layout assignment, HeroBlock Cook disabled, remove empty today.vue
- `30a4658` — feat: today cooking button, history author attribution, safe-area fix, hero empty-state
- `4ffb29c` — feat(cook): two-button dish selection with recipe match detection
- `94fc7a4` — feat(onboarding): replace absolute layout with flex, add lang=ts
- `376d90f` — feat(layout): add BottomTabBar with 5 tabs, wire into default layout
- `adff924` — feat(auth): add fake login flow, form validation, route protection, darkStatus
- `5a16375` — chore: update git log in progress.md
- `ef1d539` — feat(auth): replace fake login with real Directus auth + signup proxy
- `96cde43` — chore: update git log in progress.md
- `b130126` — feat(docs): sync progress log, reorder roadmap phases, update AGENTS workflow
- `7caac6a` — feat(schema): create 5 Directus collections + dynamic login redirect
- `ba67cc7` — fix(frontend): typescript and syntax cleanup
- `46c47da` — fix(auth): replace Transition v-if with v-show, add autocomplete attributes
- `4d4b236` — fix(auth): smooth opacity-only field transition, stable form height
- `514a823` — chore: add camera indicator to notch, commit frequency rules, update progress
- `aef7403` — feat(profile): add profile page, home header block with avatar, Gravatar → pravatar
- `da4b884` — feat(layout): add app layout with floating BottomTabBar and stub pages
- `b847eb4` — feat(navigation): update BottomTabBar with Phase 4 icons, routes, and admin logic
- `e5a2f1c` — feat(home): build Home screen with HeroBlock, RecipeCard, BalanceWidget, DutyWidget
- `8c3d1b4` — chore(home): add hero decorative assets, polish HeroBlock layout
- `11a4f05` — feat(recipe): add Recipe Detail page with ekilu-style layout, collapsible ingredients, sticky join button
- `b91dc64` — chore(frontend): migrate to Nuxt 4 app/ structure, fix nested form, add optimizeDeps
- `d7702c6` — feat(auth): add password visibility toggle, increase input font to text-base
- `e5f0e46` — feat(kitchen): add Kitchen screen with cook queue, weekly schedule, dish history
- `78b5df0` — fix(kitchen): day offset bug, WeekCalendar pill design, HeroBlock reuse
- `6903498` — chore(docs): add directus api comments, update progress, add notes rule to AGENTS.md
- `20971d4` — feat(cook): date query support, HeroBlock cook button, CORS fix, ACCESS_TOKEN_TTL
- `d484638` — chore(docs): update git log in progress.md
- `ebc1235` — fix: participants composable, remove auto-redirect, cook panel date, calendar dot, recipe edit, TS fixes
- `472cacb` — fix(profile): skip orphaned orders from deleted cook_queue entries
- `c577090` — feat(hero): show chef-cook.png fallback when queue entry has no linked recipe
- `6df42de` — feat(recipes): track cooking history via cooked_recipes junction

