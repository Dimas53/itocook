# Shopping List

## What It Does

Allows users to build a per-user shopping list by adding ingredients from recipes. The list is organized by recipe (grouped view) or flat (all items). Items are auto-cleaned up when the related meal is deducted or cancelled.

## Collections Used

- **`shopping_list_items`** — per-user entries. Fields: `user` (M2O), `recipe` (M2O), `recipe_name`, `ingredient_name`, `amount`, `unit`, `emoji`, `is_checked`, `sort`, `cook_date`.

## Files Involved

- `frontend/app/pages/shopping-list.vue` — full shopping list page
- `frontend/app/components/ShoppingListWidget.vue` — kitchen widget
- `frontend/app/pages/recipe/[id].vue` — share/ingredients bottom sheet
- `frontend/app/composables/useDeduction.ts` — cleanup on deduction/cancel

## Data Flow

```
User views recipe detail → Taps share icon → bottom sheet
    │
    ├── "Add to Shopping List"
    │     └── For each scaled ingredient, POST to /items/shopping_list_items
    │
    ├── "Copy ingredients" → clipboard with formatted text
    │
    └── "Share recipe" → navigator.share() or clipboard fallback

User views shopping-list page
    ├── "By Recipe" tab → items grouped by recipe_name
    │     └── Per-group: select-all checkbox + delete checked
    └── "All Items" tab → flat list
          └── Global select-all + "Delete all checked"
```

## Auto-Cleanup Triggers

1. **Deduction Confirmed** — Deletes items where `recipe` matches linked recipe UUID (or `recipe_name` + `cook_date` fallback)
2. **Cooking Cancelled** — Same `cleanupShoppingList()` called
3. **Manual Deletion** — Check/uncheck items, delete checked individually or globally

## Key Design Decisions

- **Per-recipe grouping with select-all** — Natural workflow: buy everything for one dish at a time.
- **`cook_date` field** — Accurate cleanup and visual display per meal.
- **Widget state indicators** — Orange pastel when pending, green pastel when all checked.
- **Permission scoping** — CRUD scoped to `$CURRENT_USER`.

## Edge Cases & Limitations

- **Items without recipe link** — Never auto-cleaned; must be manually deleted.
- **No batch cleanup on admin actions** — Admin deletes in Directus don't trigger cleanup.
- **Checked items persist** — Remain until explicitly deleted via delete-checked action.
