# Database Schema

## Custom Collections

| Collection | Purpose | Key Fields | Policy |
|---|---|---|---|
| `recipes` | Recipe catalog | `dish_name`, `category`, `ingredients`(JSON), `steps`(JSON), `photo`, `forked_from`, `pasta_packages`, `servings` | Create own, Read all, Update own, Delete own |
| `cook_queue` | Cooking sessions | `date`, `dish_name`, `status`, `category`, `recipe` | Create own, Read all, Update own, Delete own |
| `orders` | Meal participation | `status`, `user`, `cook_queue`, `guests`(JSON) | Create own, Read own, Update own, Delete own |
| `balances` | Per-user account | `amount`(decimal), `user`(unique) | Read own, Update(admin proxy) |
| `transactions` | Financial records | `amount`(decimal), `type`, `description`, `date`, `user` | Create(admin proxy), Read own, Delete own |
| `recipe_likes` | Recipe likes | `recipe`, `user` | Create own, Read all, Delete own |
| `shopping_list_items` | Shopping list | `ingredient_name`, `amount`, `unit`, `emoji`, `is_checked`, `sort`, `cook_date`, `recipe_name` | Create own, Read own, Update own, Delete own |
| `cleaning_schedule` | Duty roster | `date`, `user`, `department`, `confirmed` | Read all, Update own(confirmed) |
| `app_settings` | Global singleton | `pasta_package_price`(decimal) | Read all, Update(admin proxy) |
| `notifications` | In-app notifications | `user`(M2O), `type`, `title`, `message`, `is_read`, `icon`, `link` | Create(flow), Read own, Update own(is_read) |
| `push_subscriptions` | Browser push subs | `endpoint`, `p256dh`, `auth`, `user`(M2O) | Create own, Read own, Delete own |
| `company_account` | Company budget | `balance`(decimal), `updated_at` | Read(all), Update(admin proxy) |
| `company_transactions` | Company payments | `amount`, `description`, `cook_queue`(M2O) | Read own, Create(admin proxy) |

## System Collections in Use

| Collection | Usage |
|---|---|
| `directus_users` | User accounts; custom fields: `department`(string), `avatar`(M2O→files) |
| `directus_files` | Uploaded photos (recipe images, avatars) |
| `directus_folders` | `recipe-photos` folder |

## Relations Diagram

```
directus_users
  ├── cook_queue.cook            (M2O: one user → many queue entries)
  ├── orders.user                (M2O: one user → many orders)
  ├── balances.user              (M2O: one user → one balance)
  ├── transactions.user          (M2O: one user → many transactions)
  ├── recipes.cook               (M2O: one user → many recipes)
  ├── recipe_likes.user          (M2O: one user → many likes)
  ├── shopping_list_items.user   (M2O: one user → many items)
  ├── cleaning_schedule.user     (M2O: one user → many duty entries)
  ├── notifications.user         (M2O: one user → many notifications)
  ├── push_subscriptions.user    (M2O: one user → many subscriptions)
  └── directus_users.avatar      (M2O→directus_files)

recipes
  ├── forked_from                (M2O→recipes self-ref: original recipe)
  ├── cook_queue.recipe          (M2O←cook_queue: linked fork)
  ├── recipe_likes.recipe        (M2O←recipe_likes: likes, CASCADE)
  └── shopping_list_items.recipe (M2O←shopping_list_items)

cook_queue
  └── orders.cook_queue          (M2O←orders: all orders for this queue)
  └── company_transactions       (M2O←company_transactions: company-paid meals)

orders
  └── guests                     (JSON field: guest names for company pays)
```

## Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
  directus_users {
    uuid id PK
    string email
    string first_name
    string last_name
    string department
    uuid avatar FK
  }
  recipes {
    uuid id PK
    string dish_name
    string category
    uuid cook FK
    uuid forked_from FK
    uuid source_cook_queue FK
    int pasta_packages
    int servings
  }
  cook_queue {
    uuid id PK
    date date
    string dish_name
    string status
    uuid cook FK
    uuid recipe FK
  }
  orders {
    uuid id PK
    string status
    uuid user FK
    uuid cook_queue FK
    json guests
  }
  balances { uuid id PK; decimal amount; uuid user FK }
  transactions { uuid id PK; decimal amount; string type; uuid user FK }
  recipe_likes { uuid id PK; uuid recipe FK; uuid user FK }
  shopping_list_items { int id PK; uuid user FK; uuid recipe FK; string ingredient_name; boolean is_checked }
  cleaning_schedule { uuid id PK; date date; boolean confirmed; uuid user FK }
  app_settings { uuid id PK; decimal pasta_package_price }
  notifications { uuid id PK; uuid user FK; string type; string title; boolean is_read; string icon }
  push_subscriptions { uuid id PK; string endpoint; string p256dh; string auth; uuid user FK }
  company_account { uuid id PK; decimal balance }
  company_transactions { uuid id PK; decimal amount; string description; uuid cook_queue FK }

  directus_users ||--o{ recipes : "creates"
  directus_users ||--o{ cook_queue : "cook"
  directus_users ||--o{ orders : "joins"
  directus_users ||--|| balances : "balance"
  directus_users ||--o{ transactions : "transactions"
  directus_users ||--o{ recipe_likes : "likes"
  directus_users ||--o{ shopping_list_items : "items"
  directus_users ||--o{ cleaning_schedule : "duty"
  directus_users ||--o{ notifications : "notifications"
  directus_users ||--o{ push_subscriptions : "push subs"
  recipes }o--o| recipes : "forked from"
  recipes ||--o{ recipe_likes : "liked by"
  recipes ||--o{ shopping_list_items : "ingredients"
  cook_queue }o--o| recipes : "linked recipe"
  cook_queue ||--o{ orders : "participants"
  cook_queue ||--o{ company_transactions : "company paid"
```
