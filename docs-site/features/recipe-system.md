# Recipe System

## What It Does

Manages reusable dish definitions (recipes). Users can create, view, edit, fork, like, and share recipes. Recipes serve as templates that cooks can link to their cook_queue entries.

## Collections Used

- **`recipes`** — dish definitions. Fields: `dish_name`, `category`, `description`, `ingredients` (JSON), `steps` (JSON), `photo`, `pasta_packages`, `servings`, `forked_from`, `user_created`.
- **`recipe_likes`** — junction collection. Fields: `recipe` (M2O → recipes), `user` (M2O → users).

## Files Involved

- `frontend/app/pages/recipe/[id].vue` — recipe detail
- `frontend/app/pages/recipe/create.vue` — create/edit recipe form
- `frontend/app/pages/recipes.vue` — all recipes listing
- `frontend/app/composables/useRecipeImage.ts` — image resolution
- `frontend/app/composables/useRecipeServings.ts` — serving scaling
- `frontend/app/utils/dedupRecipes.ts` — recipe deduplication
- `frontend/app/utils/ingredientIcons.ts` — ingredient → emoji mapping

## Dedup Logic

When displaying recipe lists, `dedupRecipes()` groups by `dish_name`:

1. **Group by dish_name** — case-insensitive exact match
2. **Prefer forks within group** — forked recipes take priority over originals
3. **Date-based tiebreaker** — most recently created entry wins
4. **Empty names filtered** — recipes with null/empty `dish_name` excluded

Used on: home, kitchen, cook page dish picker, all recipes.

## Fork Pattern

When a cook selects another user's recipe:

1. `saveDish()` checks ownership
2. Creates a fork: deep copy with `forked_from = originalRecipe.id`
3. Links `cook_queue.recipe` to the new fork
4. On repeat cooking: reuses existing fork

## Key Design Decisions

- **Fork over junction table** — Fork pattern enables per-cook modification at the cost of data duplication, mitigated by dedup.
- **Owner-based edit permission** — Edit available if recipe owner OR today's cook with linked queue entry.
- **Servings scaling** — `useRecipeServings` scales ingredient amounts proportionally. Base amounts stored in Directus.
- **Like counts** — Batch-fetched on listing pages to avoid N+1 queries.

## Edge Cases & Limitations

- **Stringified JSON fields** — `ingredients` and `steps` may return as strings; use `parseJsonField` for safe parsing.
- **Recipe without photo** — Falls back to category-based demo PNG via `useRecipeImage`.
- **Orphaned forks** — Deleting a fork does not affect the original recipe.
- **No photo upload in detail view** — Only available in create/edit mode.
