# Phase 3: Directus Schema Setup

## Goal
Create all Directus collections via MCP before starting screen layout. Schema-first approach.

## Completed
- `cook_queue` collection — fields: date, cook (M2O→directus_users), dish_name, category, status, recipe (M2O→recipes)
- `orders` collection — fields: user (M2O→directus_users), cook_queue (M2O→cook_queue), status
- `order_items` collection — fields: order (M2O→orders), quantity
- `transactions` collection — fields: user (M2O→directus_users), amount, type, description, date
- `balances` collection — fields: user (M2O→directus_users), amount
- `recipes` collection — fields: dish_name, category, description, ingredients (JSON), steps (JSON), photo, pasta_packages, forked_from
- `app_settings` singleton — fields: pasta_package_price (decimal, default 1.00)
- `recipe_likes` collection — fields: recipe (M2O→recipes), user (M2O→directus_users)
- Permissions set for User role (read/create/update/delete per collection)
- 4 seed recipes created (Caesar Salad, Spaghetti Carbonara, Tomato Soup, Grilled Salmon)

## Key decisions
- UUID primary keys for all collections
- JSON arrays for ingredients and steps (flexible schema, no separate tables)
- `app_settings` as singleton (single-row config pattern)
- `forked_from` field for future recipe fork pattern

## Key collections created
- `cook_queue`, `orders`, `order_items`, `transactions`, `balances`, `recipes`, `app_settings`, `recipe_likes`

## Status
DONE ✅ — 2026-06-03
