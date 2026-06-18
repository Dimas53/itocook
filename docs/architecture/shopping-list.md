# Shopping List

## What It Does

Allows users to build a per-user shopping list by adding ingredients from recipes. The list is organized by recipe (grouped view) or flat (all items). Items are auto-cleaned up when the related meal is deducted or cancelled, keeping the list relevant to upcoming meals only.

## Collections Used

- **`shopping_list_items`** — per-user shopping list entries. Fields: `user` (M2O → users), `recipe` (M2O → recipes), `recipe_name` (string), `ingredient_name` (string), `amount` (string), `unit` (string), `emoji` (string), `is_checked` (boolean, default false), `sort` (integer), `cook_date` (date, nullable).

## Files Involved

- `frontend/app/pages/shopping-list.vue` — full shopping list page with By Recipe / All Items tabs
- `frontend/app/components/ShoppingListWidget.vue` — kitchen page widget (unchecked count, tap → /shopping-list)
- `frontend/app/pages/recipe/[id].vue` — share/ingredients bottom sheet with "Add to Shopping List" option
- `frontend/app/components/AddIngredientPopover.vue` — ingredient quick-pick UI
- `frontend/app/composables/useDeduction.ts` — `cleanupShoppingList()` called on confirmDeduction
- `frontend/app/pages/cook.vue` — `cancelCooking()` calls `cleanupShoppingList()`

## Data Flow

```
User views recipe detail
    │
    ▼
Taps share icon → bottom sheet opens
    │
    ├── "Add to Shopping List"
    │     └── For each scaled ingredient, POST to /items/shopping_list_items
    │           ├── user = current user
    │           ├── recipe = recipe UUID (if linked)
    │           ├── ingredient_name, amount, unit, emoji = from recipe
    │           └── cook_date = from active cook_queue entry (if any)
    │
    ├── "Copy ingredients" → clipboard with formatted text
    │
    └── "Share recipe" → navigator.share() or clipboard fallback

User views shopping-list page
    │
    ├── "By Recipe" tab → items grouped by recipe_name
    │     └── Per-group: select-all checkbox + delete checked
    │
    └── "All Items" tab → flat list
          └── Global select-all + "Delete all checked" button
```

## Auto-Cleanup Triggers

Shopping list items are deleted automatically in two scenarios:

### Trigger 1: Deduction Confirmed (`confirmDeduction()`)
When the cook confirms the deduction for a meal, `cleanupShoppingList()` runs:
1. **Strategy A (primary)**: Delete all items where `recipe` matches the linked recipe UUID
2. **Strategy B (fallback)**: Delete all items where `recipe_name` matches the dish name AND `cook_date` matches the queue date

### Trigger 2: Cooking Cancelled (`cancelCooking()`)
When the cook cancels their cook_queue entry, the same `cleanupShoppingList()` is called.

### Trigger 3: User Manual Deletion
Users can:
- Check/uncheck individual items (PATCH `is_checked`)
- Delete all checked items in a group (DELETE loop)
- Delete all checked items globally

**Why two strategies?** — Items added from a recipe linked to a cook_queue have a `recipe` UUID, making deletion precise. Items added without a recipe link (e.g., custom ingredients) only have `recipe_name` and `cook_date`, so the fallback matches by text. This covers both exact and fuzzy cleanup.

**Best-effort policy** — Cleanup errors are silently caught. The deduction or cancel already succeeded; cleanup is a convenience, not a consistency requirement.

## Key Design Decisions

**Per-recipe grouping with select-all** — Each recipe group in "By Recipe" view has its own select-all checkbox. This lets users quickly check off all ingredients for a single recipe, which is the natural workflow (buy everything for one dish at a time).

**`cook_date` field** — Stored alongside each item for two purposes: (1) accurate cleanup by date, and (2) visual display (e.g., "Wed, Jun 17") so users know which meal each item belongs to.

**Widget state indicators** — `ShoppingListWidget` shows `bg-orange-pastel` when items are pending, `bg-green-pastel` when all checked. Gives at-a-glance status without opening the full page.

**Permission scoping** — User Policy on `shopping_list_items`: create/read/delete scoped to `$CURRENT_USER`, update limited to `is_checked` and `sort` fields. Users can only see and manage their own items.

## Edge Cases & Limitations

- **Items without recipe link** — If a user adds ingredients from a recipe that isn't linked to a cook_queue entry, `recipe` UUID and `cook_date` will be null. These items are never auto-cleaned and must be manually deleted.
- **Orphan cleanup** — Items referencing a deleted recipe remain in the DB (no cascade). The `recipe_name` field preserves the name even after recipe deletion.
- **No batch cleanup on admin actions** — If an admin deletes a cook_queue entry directly in Directus, shopping list cleanup is not triggered. The items remain until manually deleted.
- **Checked items persist** — Checking an item does not delete it. Items remain in the list until explicitly deleted via the delete-checked action.
