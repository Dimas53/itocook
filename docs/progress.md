# ItoCook — Progress Log

## Current status
- [x] **Task E: Admin Finances page** — balances overview (all users, color-coded), manual top-up form (select user + amount + note, creates transaction + updates balance), transaction history (last 50, date desc), pasta package price inline edit (reuses existing app_settings from Task F). Created Nuxt server routes: `GET /api/users/list` (admin proxy), `PATCH /api/settings/pasta-price`. Gate already in BottomTabBar (non-User role → ChartBar tab → /finance).
- [x] **Finance polish + low-balance restriction** — explicit minus sign for negative balances; tiered BalanceWidget coloring (bg-primary-pale/≥0, bg-red-50/-0.01 to -5, bg-red-100/< -5); `useBalanceCheck` composable (threshold -30); balance gate on Join (via `useParticipants.join`) and Become Cook (via `cook.vue.assignAsCook`); collapsible transaction history (show 5, expand to scrollable max-h-[400px] with toggle).
- [x] **Finance polish round 2** — removed "(owed)" label from negative balances; reorder sections to Balances → Manual Top-up → Pasta Package Price → Transaction History; BalanceWidget thresholds adjusted (>=5 default, 0–<5 mild red-50, <0 strong red-100); transaction history replaced with recipe/create.vue slider pattern (VISIBLE_COUNT=5, up/down arrows, translateY transition, touch handlers) + separate "Show all" button expanding to full list.
- [x] **Feat: Edit Recipe in scheduled state** — added "Edit Recipe" / "Add Recipe" button to `cook.vue` 'scheduled' state, reusing the same `recipeSearchDone`/`existingRecipeId` pattern from the 'cooking' state. Cook can now edit recipe details before starting to cook.
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
- **RecipeImageUpload paste on edit** — paste listener is not blocked when editing an existing recipe with a photo; paste triggers `processFile` which replaces the preview. Workaround: OK — the deferred pattern means nothing is uploaded until save, and old photo is cleaned up on save if replaced.

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
 - [x] **Fix: RecipeGridItem image binding** — changed template to use `image.src` (Vue template unwraps refs) and added `alt` attribute for accessibility.

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

## Fixes — seventh session
- [x] **Fix: Permissions 403 on PATCH/DELETE directus_files** — added `update` + `delete` permissions for User Policy on `directus_files` (all fields `*`); resolves the 403 from the PATCH fallback in `uploadFile()` that sets folder after upload
- [x] **Fix: Orphaned file cleanup on save failure** — `submitRecipe()` in `recipe/create.vue` now tracks `uploadedFileId` and calls `deleteFile()` if recipe save fails after upload
- [x] **Fix: Old photo cleanup on edit** — `recipe/create.vue` stores `originalPhoto` when loading recipe for editing; on successful save, deletes the old file if photo was replaced or cleared
- [x] **Fix: HeroBlock photo priority** — `kitchen.vue` now fetches `photo` field from matching recipe and passes it in `heroCook`; uploaded recipe photo takes priority over category demo image
- [x] **Fix: recipe detail hero image** — uploaded photos use `object-cover` (fill container) while demo images keep `object-contain` (fit inside)
- [x] **Fix: duplicate onMounted in RecipeImageUpload** — consolidated paste listener into single `onMounted`
- [x] **Fix: TS paste handler** — `item.getAsFile()` guarded by null check

## Fixes — eighth session
- [x] **Feat: Pizza category** — added `'pizza'` to CATEGORIES in `cook.vue` and `recipe/create.vue`; added `pizza.png` to `CATEGORY_IMAGES` in `useRecipeImage.ts`; added Pizza choice to Directus `recipes.category` field
- [x] **Fix: Today cook flow → scheduled first** — `saveDish()` in `cook.vue` now always sets `status: 'scheduled'` (was `'cooking'` for today); dish state template shows same buttons for all dates (no more "Start Cooking" shortcut for today); user goes through scheduled state with Edit/Start/Cancel options
- [x] **Fix: Prefill recipe form from history** — `recipe/create.vue` now searches for existing recipe by name (via `loadRecipeFromHistory`) when opened with `?name=` but no `?id=`; pre-fills description, photo, pasta_packages, ingredients, steps
- [x] **Fix: HeroBlock category display** — added `<span v-if="cook.category">` between dish name and "by cook.name" in `HeroBlock.vue` dish info
- [x] **Fix: HeroBlock cook button disabled for all when queue exists** — added `hasExistingQueue` prop to `HeroBlock.vue`; disables "I'm cooking today!" and "Cook" buttons both via `:disabled` + `pointer-events-none` + JS guard in `onBecomeCook()`; `index.vue` tracks `hasTodayQueue` explicitly from `items.length > 0`; `kitchen.vue` added `hasSelectedQueue` computed

## Fixes — ninth session
- [x] **Security fix: cookie flags + server auth** — `directus_token` cookie: `httpOnly: false` (required by JS Bearer-token pattern for cross-origin Directus), `secure: !import.meta.dev`; created `server/utils/auth.ts` (requireAuth helper); added auth check to all 7 server API routes (excl. signup.post)
- [x] **Security fix: confirmDeduction() moved to server admin-proxy** — created `server/api/deduction/confirm.post.ts` (requireAuth + admin token); `useDeduction.ts` now calls `/api/deduction/confirm` instead of direct Directus API; horizontal escalation risk eliminated. Found: User policy has unrestricted create/update on `balances` and `transactions` (policy `e563cf6a`) — no `$CURRENT_USER` filter — but this is now mitigated by admin-proxy.
- [x] **Security fix: .env/docker-compose hardening** — changed `DIRECTUS_ADMIN_PASSWORD` from `admin` to `ItoCook2026!dev`; rotated `DIRECTUS_KEY` and `DIRECTUS_SECRET` to random 32-hex values; set `CORS_MAX_AGE` from `5` to `600`; set `ACCESS_TOKEN_TTL` from `7d` to `24h`. ⚠️ Docker restart required for changes to take effect.
- **⚠️ Admin password was changed.** After Docker restart, Directus admin login will use the new password from `.env`. The old `admin` password no longer works.
- [x] **Security fix: rate limiting on signup** — in-memory rate limiter on `/api/auth/signup` (max 5 req / 60s per IP). Map resets on server restart. No npm packages added.

## Current session
- [x] **Refactoring analysis** — analyzed 5 pages (3855 total lines) for extraction opportunities; identified 13 composable candidates, 4 cross-cutting patterns (slider, shopping list cleanup, participants fetch, date helpers); primary target: `confirmDeduction()` in `cook.vue` (64 lines, 5+ sequential API calls per participant). Findings saved to `docs/refactoring-plan.md`.
- [x] **Fix: Consistent avatar URLs** — standardized all `pravatar.cc` `u` parameter to use `user.id` across `app.vue`, `index.vue`, `recipe/[id].vue`, `profile.vue`. Previously used `email` or `displayCookName`, causing different avatars per screen for the same user.
- [x] **Fix: Avatars in finance Balances** — added user avatar (24px rounded-full) next to each name in both slider and expanded balance list on `finance.vue`.
- [x] **Fix: Avatars not showing in Balances block** — `/api/users/list` was missing `avatar` from query fields and interface. `balanceEntries` iterates this list, so `entry.user.avatar` was `undefined` for everyone. Added `&fields[]=avatar` to the admin-proxy query and `avatar: string | null` to the interface.
- [x] **Feat: Profile avatar upload** — click avatar to upload photo; resized client-side (max 400px JPEG); stored in Directus files, UUID saved to `directus_users.avatar`; `AvatarPlaceholder.vue` SVG fallback replaces Gravatar; header avatar on `index.vue` also updated; Directus permissions restricted to own-avatar-only update.
- [x] **Fix: Avatar upload bugs** — use server proxy (`/api/users/update-me`) for PATCH `/users/me` (CORS); removed folder parameter from `uploadFile` (folder expects UUID, not name).
- [x] **Fix: Pravatar removal from all avatar icons** — replaced pravatar in `finance.vue` (balances), `layouts/app.vue` (participant modal), `recipe/[id].vue` (cook pill) with conditional: uploaded photo → `AvatarPlaceholder` SVG. Added `avatar` field to all user/cook Directus queries. No pravatar references remain in `frontend/app/`.
- [x] **Task G1: Recipe detail author layout fix** — removed PhChefHat icon, moved author line into photo block (bottom-left pill), restored title/category/likes layout
- [x] **Task G2: Servings selector with ingredient scaling** — servings UI pills [base,10,15,20] + custom input below category; `scaleAmount()` with ratio scaling + whole-unit ceil; scaled amounts render in `text-primary font-semibold`; "Apply for N participants" button; `servings` field added to Directus fetch
- [x] **Fixes: 4 UI/logic fixes** — (1) Join button hidden for recipe cook, (2) Eye icon on Today's Dish in cook panel, (3) Servings selector hidden for non-cook users, (4) Author pill shows queue cook name dynamically + clickable modal with cook's recipes via slider
- [x] **Post-fix: Cook button** — entry cook sees "Start Cooking" / "View Cook Panel" button (→ /cook) instead of Join buttons
- [x] **Post-fix: Servings persistence** — `saveServingsToRecipe` now also scales ingredient amounts by ratio and saves both `servings` + `ingredients` to Directus; no flash/jump because `currentServings` is set to null after save (base = selection)
- [x] **Post-fix: Servings presets** — always 3 pills: [10, 15, 20]; if base differs, last preset (20) replaced with base value
- [x] **G3a: shopping_list_items collection** — created in Directus with fields (id, user M2O, recipe M2O, recipe_name, ingredient_name, amount, unit, emoji, is_checked, sort, date_created); permissions set for User policy (create/read=`*`, update=`is_checked,sort`, delete; all filtered by `$CURRENT_USER`)
- [x] **G3b: Shopping list page + Kitchen widget** — `shopping-list.vue` page with By Recipe / All Items tabs, toggle check, clear checked (individual DELETE loop); `ShoppingListWidget.vue` for kitchen page (unchecked count, tap → /shopping-list); kitchen header shows shopping cart icon (PhShoppingCart) instead of bell when user is cook for selected day
- [x] **G3c: Add to shopping list from recipe detail** — share icon in ingredients header opens bottom sheet modal with 3 actions: "Add to Shopping List" (POST each scaled ingredient to shopping_list_items), "Copy ingredients" (clipboard with formatted text + scaled amounts), "Share recipe" (navigator.share / clipboard fallback); success toast "Added N items to your shopping list"
- [x] **G3c polish: Widget design + share button visibility** — ShoppingListWidget now uses `bg-orange-pastel` when items pending, `bg-green-pastel` when all done; added `orange-pastel`/`orange-light` to tailwind config and design.md; share icon in recipe page enlarged to `w-9 h-9` with `bg-primary text-white`
- [x] **Fix: duplicate Start Cooking** — removed duplicate `isEntryCook` button from smart-adaptive section; only one Start Cooking exists inside status template with `startCooking` handler
- [x] **UX: participant count moved** — removed "N joined" from bottom controls; added `PhUsers` icon + count next to Portions pills row, shown when `queueEntry` exists
- [x] **Fix: all participants** — extended limit to 100, added `user.email` to fields, added `.filter(Boolean)` after map
- [x] **Fix: HeroBlock participant modal — mount in app.vue layout** — created global `useParticipantsModal.ts` composable (module-level refs); modal template moved to `app.vue` inside phone container (`relative`), so `absolute inset-0` covers the visible phone screen regardless of page scroll; `router.beforeEach` closes modal on navigation; pages (`index.vue`, `kitchen.vue`) call `pm.open(queueId)` on `@show-participants`; all local modal state/templates removed from pages
- [x] **Fix: Modal loader spinning forever** — root cause: `useParticipantsModal()` returns a plain object with `Ref` properties. Vue 3 templates do NOT auto-unwrap refs nested inside plain objects — `v-if="pm.loading"` always evaluated to the `Ref` object (truthy). Fix: wrapped `useParticipantsModal()` return value with `reactive()` in `layouts/app.vue` — `reactive()` triggers Vue's ref unwrapping in templates. `pm.loading` now correctly evaluates to the boolean value.
- [x] **Ingredient emoji icons + Add Ingredient quick-pick dropdown** — created `frontend/app/utils/ingredientIcons.ts` (emoji dictionary with 130+ entries + fuzzy `getIngredientIcon()` matcher) and `frontend/app/utils/popularIngredients.ts` (35 popular ingredients with default units); created shared `frontend/app/components/AddIngredientPopover.vue` (bottom-sheet with 2-column ingredient grid + "Custom ingredient" option); updated `recipe/create.vue` (popover opens from "+ Add" button, selects prefill name+unit, live emoji preview next to name input); updated `recipe/[id].vue` (replaced bullet dot with emoji icon in ingredient list). Shared component ready for AI Recipe page use.
- [x] **Task 5: Duty page top section** — "On duty today" card with live fetch from `cleaning_schedule`; department pill, user name, Confirm Duty button (PATCH /items/cleaning_schedule/{id}); confirmed badge in green-pastel; loading skeleton; empty state ("No duty assigned for today")
- [x] **Task 6: Monthly calendar on duty.vue** — inline month calendar (Mon–Fri) below today card; prev/next arrows; cell states (today/has entry/current user/confirmed/past); dot indicator; tap popover with user info + confirmed/pending badge; data fetch per displayed month
- [x] **Refactor: MonthCalendar component** — extracted from duty.vue into `app/components/MonthCalendar.vue`; reused in `recipe/[id].vue` date picker (replaces inline grid)
- [x] **UI tweaks:** taken dates in recipe calendar get `bg-gray-100` backdrop; DutyWidget shows "You are next" (larger, bold) when user is scheduled tomorrow
- [x] **Task 7: Admin edit mode for cleaning_schedule** — `isAdmin` check via role UUID; tap any calendar cell → popover (view/edit); department <select> (8 depts); user <select> filtered by department (fetched via `/api/users/list` with `department` field); PATCH existing / POST new entry via server proxy (`/api/duty/upsert`); re-fetch month after save
- [x] **Popover & Form fixes** — Fix 1: popover rendered inside phone frame (removed Teleport, `absolute` positioning in `relative` container). Fix 2: restructured `popularIngredients.ts` into 5 categorized `INGREDIENT_CATEGORIES`; popover now uses accordion (first category expanded, single-column list). Fix 3: `existingIngredients` prop greys out already-added items with ✓ badge. Fix 4: unit text input replaced with `<select>` (g/kg/ml/l/pcs/tbsp/tsp/bunch/to taste) with legacy value preservation. Fix 5: ingredient row widths fixed with `w-full overflow-hidden` and proper `flex-1 min-w-0`/`shrink-0` distribution.
- [x] **Fix: HeroBlock category image — root cause was missing category field on cook_queue** — added `category` string field to `cook_queue` collection (Directus); `cook.vue` `saveDish()` now persists `selectedCategory` to the queue entry; `kitchen.vue` `watch(selectedSlot)` fallback reads `category` from cook_queue item when no recipe match; Directus fields query updated to explicitly list `category`. HeroBlock now shows category image (e.g. pasta.png) when cook set name + category but no recipe yet.
- [x] **Fix: cook.vue requires both dish name AND category before enabling buttons** — added `canSchedule` computed (`dishName.trim().length > 0 && !!selectedCategory`); applied to all 4 schedule buttons in 'dish' state template; disabled styling changed to `opacity-40 cursor-not-allowed`.
- [x] **All Recipes page + Add to Queue flow** — new `/recipes` page (search + RecipeCard list with loading skeleton + empty state); "All Recipes →" link in kitchen.vue Dish History header; "🍳 Cook This" button on recipe detail with date picker bottom-sheet (14-day grid, taken dates disabled, navigates to `/cook?action=become&date=...&recipeId=...`); `cook.vue` reads `recipeId` query param and prefills dish name + category on entry into dish state.
- [x] **Fix: RecipeGridItem images on /recipes** — `RecipeGridItem.vue` prop `title` → `dish_name` to match Directus field; `useRecipeImage.ts` category lookup now lowercases key before matching (DB stores capitalized like "Salad" but map keys are lowercase like "salad").
- [x] **Fix: Like counts on Home + Kitchen** — `RecipeCard.vue` replaced `rating`+`PhStar` with optional `likeCount` prop + `PhHeart`; removed duplicate like badge from `recipe/[id].vue`; `index.vue` batch-fetches `recipe_likes` after loading recipes, passes per-recipe count to `RecipeCard`; `kitchen.vue` same batch-fetch for dish history items, renders `PhHeart` + count in each row.
- [x] **Fix: Category filter case-insensitive** — `recipes.vue` filter now lowercases both selected category and recipe category for comparison; search field also uses correct `dish_name` field.
- [x] **Fix: Reactive image in RecipeGridItem** — `const image = useRecipeImage(...)` → `:src="image.value.src"` (classic computed ref trap: destructuring `{ src }` loses reactivity). Added `likeCount` display + batch-fetch on `/recipes` page.
- [x] **Profile balance + transactions** — balance block (amount, Active pill, color-coded ±€X.XX) between Preferences and tabs; collapsible transaction history (5 rows default, Show all) with formatted date/description/amount
- [x] **SliderList component + profile refactor** — extracted reusable `SliderList.vue` (translateY slider with up/down arrows, slot-based items, touch/swipe support); refactored profile transactions, My List, and My Recipes to use SliderList with appropriate item heights and gaps
- [x] **Task 1: Schema + Department field + cleaning_schedule** — added `department` (string, nullable) to `directus_users` via Directus MCP; created `cleaning_schedule` collection (date, user→M2O, department, confirmed) with UUID PK; set User Policy permissions (read all, update own confirmed only); added `department` to User Policy `directus_users` read fields
- [x] **Task 2: Department selector in profile.vue** — added `<select>` dropdown below name/email, above Preferences, with German department options; PATCH on change via `/users/me`; pre-selects from `user.value.department`
- [x] **Task 3: Preferences bottom sheet** — Preferences card opens bottom sheet (fixed overlay + rounded-t-3xl), department selector moved inside, Done button, subtitle shows current department in primary color
- [x] **Fix: PATCH /users/me CORS** — создан Nuxt server route `/api/users/update-me` для проксирования запроса
- [x] **Seed: 6 test users + cleaning_schedule** — созданы Klaus, Anna, Thomas, Sabine, Michael, Laura с отделами; 9 записей cleaning_schedule на 16–27 июня (будни)
- [x] **Fix: MCP user filter** — `_nstarts_with=MCP` в обоих server routes (list + count); причина: first_name = "MCP User"
- [x] **Task 4: DutyWidget live data** — компонент сам запрашивает cleaning_schedule на неделю; top line (отдел / "You're next!"), middle (имя дежурного), bottom (статус); фон градиентами; декоративный SVG в левом верхнем углу
- [x] **G3d: Shopping list polish** — added `cook_date` field to `shopping_list_items` (Directus); stored from queue entry when adding items; displayed next to recipe name in By Recipe view (e.g. "Wed, Jun 17"); tabs restyled with `bg-primary-pale`/`bg-primary text-white` and icons; weekly shopping comment added
- [x] **G3d: Permission gate + recipe page UX** — "Add to Shopping List" button only shown when `isEntryCook`; photo header heart replaced with shopping cart when cook (links to `/shopping-list`); added-to-list toast includes a "View cart" shortcut button
- [x] **G3d: Copy format fix** — changed clipboard format from `• 🐟 180 g Salmon fillet` to `• 🐟 Salmon fillet 180 g` (emoji → name → amount, matching page layout)
- [x] **Fix: Fork-on-cook — always link recipe to queue entry** — added `recipe` field (M2O) to `cook_queue` Directus collection; `saveDish()` now PATCHes `recipe` after creating a fork; HeroBlock in kitchen uses linked recipe ID first; `recipe/[id].vue` queue entry search filters by current user's cook ID to avoid matching wrong queue
- [x] **Fix: Auto-cleanup shopping list** — when `confirmDeduction()` runs, deletes `shopping_list_items` for the linked recipe (by recipe ID, fallback to dish_name + cook_date)
- [x] **Shopping list UX: colorful cart, per-group select-all, red delete** — empty state cart icon in red circle; each recipe group in By Recipe view has its own select-all checkbox in the header row (checkbox → name → date right-aligned); All Items view has global select-all + "Delete all checked" button; `PhTrash` changed to `text-red-500`
- [x] **Fix: Cancel queue → auto-cleanup shopping list** — `cancelCooking()` deletes `shopping_list_items` for the linked recipe (same logic as `confirmDeduction`)

## Refactoring session — Phase 1–2
- [x] **Phase 1: Replace manual sliders with SliderList.vue** — history slider in `cook.vue`, both sliders (balances + transactions) in `finance.vue`, cook recipes slider in `recipe/[id].vue`. Removed scroll/touch/arrow code (~140 lines total).
- [x] **Phase 1: Extract useParticipants.participantsList** — extended `useParticipants.ts`; migrated `cook.vue` + `recipe/[id].vue` off local `fetchParticipants()`/`participants` ref.
- [x] **Phase 1: Create utils/dates.ts** — 7 shared date functions; 8+ files can import instead of redefining.
- [x] **Phase 2, candidate 1: Create useDeduction.ts** — extracted `confirmDeduction`, `loadPastaCost`, `cleanupShoppingList` from `cook.vue` (~90 lines); parallelized transactions (`Promise.all`) + batch-fetch balances (`_in` filter); `cleanupShoppingList` shared with `cancelCooking`.
- [x] **Fix: pasta-price PATCH 500** — `app_settings` is a singleton; PATCH `/items/app_settings/{id}` rejected by Directus ("Route doesn't exist"). Removed ID lookup, PATCH `/items/app_settings` directly.
- [x] **Fix: cook→recipe navigation missing ?cq=** — recipe page не находил queue entry по dish_name; добавлен `?cq=${cookEntry.id}` во все ссылки на рецепт.
- [x] **Phase 2, candidate 2: useRecipeServings.ts** — extract all serving/scaling logic (~85 lines) from `recipe/[id].vue` into composable.
- [x] **Fix: canAddToList restriction** — кнопка "Add to Shopping List" показывается только когда `isEntryCook` (повар очереди).
- [x] **Phase 2, candidate 3: Template dedup** — extracted shared receipt info rows into `ReceiptSummary.vue`, used in ready state breakdown.
- [x] **Phase 2, candidate 4: Finance template dedup** — extracted BalanceRow + TransactionRow components, replaced slider/expanded templates in finance.vue.
- [ ] **Phase 2, candidate 5: useDateNavigation.ts** — extract date-nav from `recipe/[id].vue`, `finance.vue`, `cook.vue`.
- [ ] **Task B': Reminder mechanism for overdue cost entry (groundwork)
- [ ] **Task D: Ghost participants / leave-join logic
- [ ] **AI Recipe** — chat with AI, JSON recipe render, serving recalculation
- [ ] **Common screen** — group purchases, announcements, polls
- [ ] **Notifications** — feed, quick actions
- [ ] **Receipt photo upload**

## Git log
- `1a83b66` — refactor: extract formatUserName utility, replace 13 inline copies
- `b881bf30` — fix(profile): show creation date in My Recipes; add pasta-to-ingredients sync in editor
- `1eda3198` — fix: derive pasta cost from ingredients array; navigate to cook form on Lunch is ready
- `74b8b748` — docs: update progress log with recent commits
- `245fb96d` — refactor: add parseJsonField utility, remove dead code, extract ActionBlockedModal component
- `fe0e9f7` — refactor: extract BalanceRow and TransactionRow components, dedup finance.vue templates
- `c5159cb` — refactor: extract ReceiptSummary component, dedup receipt rows in cook.vue
- `a700b57` — refactor: extract useRecipeServings composable, restrict canAddToList to isEntryCook
- `0b9d369` — fix(cook): pass cq param to recipe links for reliable queue detection
- `c88c50e` — refactor: extract useDeduction composable, replace manual sliders with SliderList, fix pasta-price PATCH
- `f8089ec` — feat(profile): avatar upload with SVG fallback, remove pravatar everywhere
- `b532f5c` — feat: servings selector with scaling, participant modal in layout, duty tomorrow indicator, cook eye icon, author pill modal
- `d80c44e` — feat(duty): add admin edit mode for cleaning_schedule assignments
- `a2a75f6` — refactor(calendar): extract MonthCalendar component, use in duty and recipe pages
- `9d42482` — chore: uncommitted changes from previous sessions
- `b7ddd47` — fix(recipe): reactive image in RecipeGridItem, batch-fetch likes on all pages
- `80afb1d` — feat(cook): persist category to cook_queue, show category image in HeroBlock, require category for schedule/save
- `3ae6859` — feat(cook): split lunch-ready from receipt entry (Task A')
- `10cd5b6` — feat(cook): cancel cooking, fix naming collision in useTotalUsers, replace hardcoded user count
- `b7a7ca1` — fix(cook): deferred recipe photo upload, folder PATCH fallback, scroll history with swipe + arrows, hide tab bar on cook page
- `04fc50f` — feat(recipe): add pasta_packages field and pasta cost in deduction (Task F); fix(kitchen): remove redundant become-cook button under calendar
- `d695b45` — fix(hero): add JS guard on Cook button — disabled attr alone wasn't reliable; remove invert class from status bar as intended
- `14e2c08` — fix(hero): guard HeroBlock Cook button with JS check — disabled attr alone wasn't blocking navigation
- `bf2f2bd` — fix(layout): safe-area top bar on app layout, layout assignment, HeroBlock Cook disabled, remove empty today.vue
- `30a4658` — feat: today cooking button, history author attribution, safe-area fix, hero empty-state
- `4ffb29c` — feat(cook): two-button dish selection with recipe match detection
- `94fc7a4` — feat(onboarding): replace absolute layout with flex, add lang=ts
- `376d90f` — feat(layout): add BottomTabBar with 5 tabs, wire into default layout
- `adff924` — feat(auth): add fake login flow, form validation, route protection, darkStatus
- `8d69f3b` — feat(widgets): add decorative star SVG to BalanceWidget and DutyWidget
- `d47aa2e` — feat(finance): add slider with arrows to Balances block (5 per screen)
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
- `2cdf2fb` — fix(photo): permissions, deferred cleanup, all 7 TS errors
- `84db77c` — feat(finance): admin finance page with balances, top-up, history, pasta price setting (Task E)
- `f4ebfec` — feat: add pizza category, fix today cook flow, prefill recipe from history, disable hero cook when queue exists
- `97871ba` — feat(recipe): add weekday-only date picker with 3-week pagination and month indicator
- `b28a32c` — feat(recipe): add share shopping list with native share + clipboard fallback
- `d5eebb6` — feat(profile): add balance display and transaction history
- `f42c115` — feat(profile): extract SliderList component, refactor all profile lists
- `51d9fa3` — feat(schema): add department field to users, create cleaning_schedule collection
- `9ae8bf2` — feat(profile): move department selector to top, use select dropdown
- `2a0c684` — fix(profile): compact department select styling
- `be230b5` — feat(profile): move department to Preferences bottom sheet
- `703c66f` — fix(profile): preferences sheet inside frame, height, select padding
- `fed5e9b` — fix(profile): proxy PATCH /users/me via server route to bypass CORS
- `c1f0aa1` — chore(seed): create 6 test users with departments + cleaning_schedule entries
- `a2be88b` — feat(duty): add monthly calendar with cell states and popover (Task 6)
- `344e137` — fix(duty): add id to fields, proxy confirm PATCH through server route
- `b973505` — fix(duty): sync calendar after confirm, allow clicking past dates
- `648d1f3` — feat(shopping-list): cook_date, per-group select-all, auto-cleanup, fork fix
- `4a0940a` — feat(recipes): dedup by dish_name across all recipe lists, cleanup unused collections
- `7894e5a` — fix(recipe): detect cook_queue by recipe ID first, fall back to dish_name
- `30d9bd3` — fix(security): add requireAuth to all server routes, fix cookie flags
- `a955fa1` — fix(security): move confirmDeduction to admin-proxy server route
- `0ffe1d6` — fix(security): rotate admin password, key/secret, tighten CORS/TTL
- `661a824` — fix(security): rate limit signup — 5 req / 60s per IP

