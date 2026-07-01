# Spec: Phase 3 — Directus Schema

## Objective

Create all collections via Directus MCP before any screen layout. Schema-first approach.

## Collections

| Collection | Type | Key Fields |
|-----------|------|-----------|
| `cook_queue` | regular | date, cook (M2O user), dish_name, status, category, recipe (M2O) |
| `orders` | regular | user (M2O), cook_queue (M2O), status |
| `order_items` | regular | order (M2O), quantity |
| `transactions` | regular | user (M2O), amount, type, description, date |
| `balances` | regular | user (M2O), amount |
| `recipes` | regular | dish_name, category, description, ingredients (JSON), steps (JSON), photo, pasta_packages, forked_from |
| `app_settings` | singleton | pasta_package_price (decimal, default 1.00) |
| `recipe_likes` | junction | recipe (M2O), user (M2O) |

## Project Structure

N/A — schema lives in Directus database, not in git (except migration notes).

## Boundaries

- **Always:** UUID primary keys, field-level permissions on `directus_users`
- **Ask first:** Deleting collections, changing field types, adding admin-only fields
- **Never:** Non-admin role with write access to `directus_users`, collections without access policy check

## Key Gotchas

- Singleton: `PATCH /items/app_settings` — no ID suffix needed
- Directus flows live in DB, not git — manual sync to production
- `directus_users` field-level restriction required: no email/password exposure to users
- M2M junction `recipe_likes` — both sides need correct `one_field`/`junction_field`

## Success Criteria

1. All 8 collections created with correct field types
2. User role: read/write own data (orders, transactions, balances)
3. Admin role: full access to all collections
4. Recipes readable by all authenticated users
5. `app_settings` singleton seeded with pasta_package_price = 1.00
