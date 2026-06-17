# ItoCook — Project State Overview

> Generated: 2026-06-17

---

## 1. Frontend Pages Status

### ✅ Fully Working

| Page | Route | Status | Notes |
|---|---|---|---|
| **Onboarding** | `/onboarding` | ✅ | Flexible layout, TypeScript |
| **Auth** | `/auth` | ✅ | Login/register, form validation, token in cookie |
| **Home** | `/` | ✅ | HeroBlock, BalanceWidget, DutyWidget, Recent Dishes with likes |
| **Kitchen** | `/kitchen` | ✅ | WeekCalendar, HeroBlock, Dish History search, ShoppingListWidget |
| **Cook Panel** | `/cook` | ✅ | 6 states (assign→dish→scheduled→cooking→ready→done), cancel, fork, balance gate |
| **Recipe Detail** | `/recipe/[id]` | ✅ | Photo, status badges, join, servings scaler, like, cook pill modal |
| **Recipe Create/Edit** | `/recipe/create` | ✅ | Photo upload, AddIngredientPopover, prefill from history, deferred cleanup |
| **All Recipes** | `/recipes` | ✅ | Search + category filter, RecipeCard grid with likes, "Cook This" date picker |
| **Profile** | `/profile` | ✅ | Avatar upload, My List (with 10h leave rule), My Recipes, Preferences sheet, balance+transactions |
| **Finance** | `/finance` | ✅ | Admin only — all balances, top-up form, transaction history, pasta price |
| **Duty** | `/duty` | ✅ | Today's duty card, MonthCalendar, Admin edit mode |
| **Shopping List** | `/shopping-list` | ✅ | By Recipe / All Items tabs, select-all, delete checked, auto-cleanup on confirm/cancel |

### 🟡 Partial / Needs Polish

| Page | Missing |
|---|---|
| **Recipe Detail** | Cooking steps display, ratings/reviews |
| **Cook Panel** | Receipt photo upload |
| **Profile** | Statistics (times cooked, on duty), notification settings |
| **Kitchen** | Weekly menu, anonymous ratings |

### ⬜ Not Started

| Page | Route | What's needed |
|---|---|---|
| **AI Recipe** | `/ai-recipe` | Chat UI, JSON recipe render, "Add to recipes", share list |
| **Common** | `/common` | Announcements, pool collections, progress bars |
| **Notifications** | `/notifications` | Feed, quick actions, mark all read |

---

## 2. Directus Schema

### Custom Collections (9)

#### `recipes` — Main recipe catalog
- **Fields:** `id` (UUID PK), `dish_name` (required), `cook` (M2O→users), `category` (select: salad/soup/pasta/meat/fish/dessert/pizza/other), `description` (text), `ingredients` (JSON list: name/amount/unit), `steps` (JSON list: step/description), `photo` (file UUID), `source_cook_queue` (M2O→cook_queue), `forked_from` (M2O→recipes, self-ref), `pasta_packages` (int), `servings` (int), system fields
- **Relations:** `cook`→`directus_users`, `source_cook_queue`→`cook_queue`, `forked_from`→`recipes` (self)
- **User Policy:** Create own, Read all, Update own, Delete own

#### `cook_queue` — Scheduled cooking sessions
- **Fields:** `id` (UUID PK), `date` (date), `dish_name` (string), `status` (select: scheduled/cooking/ready/cancelled), `cook` (M2O→users), `category` (select), `recipe` (M2O→recipes, linked fork), system fields
- **Relations:** `cook`→`directus_users`, `recipe`→`recipes`
- **User Policy:** Create own, Read all, Update own, Delete own

#### `orders` — Lunch participation orders
- **Fields:** `id` (UUID PK), `status` (select: pending/confirmed/cancelled/completed), `user` (M2O→users), `cook_queue` (M2O→cook_queue), system fields
- **Relations:** `user`→`directus_users`, `cook_queue`→`cook_queue` (backlinked as O2M `orders`)
- **User Policy:** Create own, Read own, Update own, Delete own

#### `balances` — User balances (one per user)
- **Fields:** `id` (UUID PK), `amount` (decimal), `user` (M2O→users, unique), system fields
- **Relations:** `user`→`directus_users`
- **User Policy:** Read own, Update (admin proxy), Create (admin proxy)

#### `transactions` — Financial transactions
- **Fields:** `id` (UUID PK), `amount` (decimal), `type` (select: debit/credit), `description` (text), `date` (timestamp), `user` (M2O→users), system fields
- **Relations:** `user`→`directus_users`
- **User Policy:** Create (admin proxy), Read own, Delete own

#### `recipe_likes` — Recipe likes
- **Fields:** `id` (UUID PK), `recipe` (M2O→recipes, required), `user` (M2O→users, required), system fields
- **Relations:** `recipe`→`recipes` (CASCADE delete), `user`→`directus_users` (CASCADE delete)
- **User Policy:** Create own, Read all, Delete own

#### `shopping_list_items` — Shopping list items
- **Fields:** `id` (integer PK, auto-increment), `user` (M2O→users, required), `recipe` (M2O→recipes), `recipe_name` (string), `ingredient_name` (string, required), `amount` (decimal), `unit` (string), `emoji` (string), `is_checked` (boolean), `sort` (integer), `cook_date` (date), system fields
- **Relations:** `user`→`directus_users`, `recipe`→`recipes`
- **User Policy:** Create own, Read own, Update own (is_checked,sort), Delete own

#### `cleaning_schedule` — Duty roster
- **Fields:** `id` (UUID PK), `date` (date, required), `user` (M2O→users, required), `department` (string, required), `confirmed` (boolean)
- **Relations:** `user`→`directus_users`
- **User Policy:** Read all, Update own (confirmed only)

#### `app_settings` — Global settings (singleton)
- **Fields:** `id` (UUID PK), `pasta_package_price` (decimal, default 1.00)
- **User Policy:** Read all, Update (admin proxy)

### Deleted Collections (no longer exist)
- ~~`cooked_recipes`~~ — legacy junction (replaced by fork pattern)
- ~~`order_items`~~ — was empty, unused
- ~~`test_api`~~ — test data, unused

### System Collections in Use
- `directus_users` — user accounts, custom fields: `department` (string), `avatar` (M2O→files)
- `directus_files` — uploaded photos (recipe images, avatars)
- `directus_folders` — `recipe-photos` folder

---

## 3. Directus Relations Diagram

```
directus_users
  ├── cook_queue.cook          (M2O: one user → many queue entries)
  ├── orders.user              (M2O: one user → many orders)
  ├── balances.user            (M2O: one user → one balance)
  ├── transactions.user        (M2O: one user → many transactions)
  ├── recipes.cook             (M2O: one user → many recipes)
  ├── recipe_likes.user        (M2O: one user → many likes)
  ├── shopping_list_items.user (M2O: one user → many items)
  ├── cleaning_schedule.user   (M2O: one user → many duty entries)
  └── directus_users.avatar    (M2O→directus_files)

recipes
  ├── forked_from              (M2O→recipes self-ref: original recipe)
  ├── source_cook_queue        (M2O→cook_queue: origin queue entry)
  ├── cook_queue.recipe        (M2O←cook_queue: linked fork)
  ├── recipe_likes.recipe      (M2O←recipe_likes: likes for this recipe, CASCADE)
  └── shopping_list_items.recipe (M2O←shopping_list_items: items for this recipe)

cook_queue
  └── orders.cook_queue        (M2O←orders: all orders for this queue entry)
```

---

## 4. Data Flow Summary

### "Become Cook" Flow
1. `POST /items/cook_queue` — create entry with `cook`=current user, `status`=`scheduled`
2. `POST /items/orders` — auto-create `confirmed` order for the cook
3. Later: `PATCH /items/cook_queue/{id}` → status=`cooking` → status=`ready`
4. (Optional from recipe detail) `POST /items/orders` — other users join

### "Confirm Deduction" Flow
1. Fetch participants via `GET /items/orders?filter[cook_queue][_eq]`
2. `POST /items/transactions` — one per participant with `amount`=`-share`
3. `PATCH /items/balances` — update each participant's balance
4. `PATCH /items/cook_queue/{id}` → status=`completed`
5. `DELETE /items/shopping_list_items` — cleanup linked items

### "Cancel Cooking" Flow
1. `PATCH /items/cook_queue/{id}` → status=`cancelled`
2. `GET /items/orders` → `DELETE /items/orders/{id}` each
3. `DELETE /items/shopping_list_items` — cleanup linked items

### Fork-on-Cook Flow
1. User B cooks User A's recipe
2. `POST /items/recipes` — create copy with `forked_from`=A's recipe, `cook`=B
3. `PATCH /items/cook_queue/{id}` — link `recipe` to the new fork
4. Dedup logic shows only the latest fork per `dish_name` in recipe lists

### Shopping List Flow
1. From recipe detail: `POST /items/shopping_list_items` — one per scaled ingredient
2. Auto-deleted on `confirmDeduction` or `cancelCooking`
3. `is_checked` toggled via `PATCH` in shopping list UI

---

## 5. Build & Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS v4 |
| Icons | @phosphor-icons/vue (Ph prefix) |
| UI Framework | Nuxt UI (minimal usage) |
| Backend CMS | Directus 11.17 (Docker, PostgreSQL 15) |
| Auth | Directus auth (email/password, JWT, 7d TTL) |
| Hosting | Local Docker (frontend:3000, directus:8055, api:8000) |
