# Recipe System

## What It Does

Manages reusable dish definitions (recipes). Users can create, view, edit, fork, like, and share recipes. Recipes serve as templates that cooks can link to their cook_queue entries. The system handles recipe photo uploads, ingredient scaling by servings, deduplication on listing, and fork ownership tracking.

## Collections Used

- **`recipes`** — dish definitions. Fields: `dish_name`, `category`, `description`, `ingredients` (JSON array `{name, amount, unit}`), `steps` (JSON array `{step}`), `photo` (file UUID → directus_files), `pasta_packages` (integer, nullable), `servings` (integer), `forked_from` (UUID, self-referencing M2O), `user_created` (system, tracks owner).
- **`recipe_likes`** — junction collection. Fields: `recipe` (M2O → recipes), `user` (M2O → users). Tracks which users liked which recipes.

## Files Involved

- `frontend/app/pages/recipe/[id].vue` — recipe detail: ingredients, steps, servings, likes, queue status
- `frontend/app/pages/recipe/create.vue` — create/edit recipe form with photo upload, ingredient editor
- `frontend/app/pages/recipes.vue` — all recipes listing with search and category filter
- `frontend/app/pages/index.vue` — home page recent recipes
- `frontend/app/pages/kitchen.vue` — kitchen dish history
- `frontend/app/pages/cook.vue` — recipe selection in dish state, fork-on-cook
- `frontend/app/pages/profile.vue` — "My Recipes" tab
- `frontend/app/composables/useRecipeImage.ts` — resolves recipe photo UUID to asset URL, category fallback
- `frontend/app/composables/useRecipeServings.ts` — serving scaling logic
- `frontend/app/components/RecipeCard.vue` — recipe card for listings
- `frontend/app/components/RecipeGridItem.vue` — grid version for /recipes page
- `frontend/app/components/AddIngredientPopover.vue` — ingredient adding UI
- `frontend/app/components/RecipeImageUpload.vue` — photo upload component (file picker, drag-drop, paste)
- `frontend/app/components/ReceiptSummary.vue` — receipt breakdown (reused from cook panel)
- `frontend/app/utils/dedupRecipes.ts` — recipe deduplication utility
- `frontend/app/utils/ingredientIcons.ts` — ingredient name → emoji mapping

## Dedup Logic

When displaying recipe lists, `dedupRecipes()` groups recipes by `dish_name` and shows only one entry per group:

1. **Group by dish_name** — case-insensitive exact match.
2. **Prefer forks within group** — forked recipes (non-null `forked_from`) take priority over originals. This ensures the user sees "their version."
3. **Date-based tiebreaker** — within each subgroup (fork/original), the most recently created entry wins. This surfaces the latest modifications.
4. **Empty names filtered** — recipes with null/empty `dish_name` are silently excluded.

Used on: home page (`index.vue`), kitchen (`kitchen.vue`), cook page dish picker (`cook.vue`), all recipes (`recipes.vue`).

## Fork Pattern

When a cook selects another user's recipe in the cook panel:

1. `saveDish()` checks if the recipe is owned by another user
2. Creates a fork: deep copy of the recipe with `forked_from = originalRecipe.id`, owned by the current cook
3. Links the `cook_queue.recipe` field to the new fork
4. On repeat cooking: reuses the existing fork (checks for existing fork by same user + same `forked_from`)

**Why forks and not PATCH:** Without forks, editing a shared recipe (e.g., scaling servings, modifying ingredients) would overwrite the original author's version. The fork pattern gives each cook their own mutable copy while preserving the original as a reference. Recipe listing dedup hides the multiplicity.

## Recipe Photo Upload

1. User selects file (file picker, drag-drop, or paste from clipboard)
2. Client-side resize: canvas, max 1200px, JPEG quality 0.85, max 5MB
3. Upload to Directus Files via `useDirectus.uploadFile()` — stores in `recipe-photos` folder
4. Secondary PATCH fallback: if the folder field is ignored on initial POST, a PATCH sets it
5. Stores the returned file UUID in `recipes.photo`
6. On edit: if photo is replaced, old file is deleted via `deleteFile()`
7. On save failure: uploaded file is cleaned up to avoid orphaned files

**Image resolution in templates:** `useRecipeImage` returns `{ src, isUploaded }`. Uploaded photos render as circular thumbnails (rounded-full, 68-72px). Demo category PNGs keep full-width display.

## Key Design Decisions

**Fork over junction table** — Initially planned as a junction table (`cooked_recipes`), replaced by the fork pattern. Junction tables track "who cooked what" but don't allow per-cook modifications. Fork pattern enables modification at the cost of data duplication, mitigated by dedup.

**Owner-based edit permission** — `canEdit` computed in `recipe/[id].vue`: visible if recipe owner OR today's cook with linked queue entry. Non-owners can view but not edit.

**Servings scaling** — `useRecipeServings` scales ingredient amounts proportionally when the cook changes the servings count. Displayed in scaled view only; base amounts are stored in Directus. Save persists both `servings` and scaled `ingredients`.

**Like counts** — `recipe_likes` is a simple junction collection. Like counts are batch-fetched on recipe listing pages (home, kitchen, recipes) to avoid N+1 queries. Each page does one aggregate query and maps counts to recipe IDs.

## Edge Cases & Limitations

- **Stringified JSON fields** — `ingredients` and `steps` are stored as JSON arrays. Need `parseJsonField` utility for safe parsing (Directus may return strings or parsed objects depending on the API version).
- **Recipe without photo** — Falls back to category-based demo PNG (e.g., `pasta.png`, `salad.png`) via `useRecipeImage`. If no category match, shows generic `other.png`.
- **Orphaned forks** — If a user deletes their fork, the original recipe is unaffected. No cascading deletes.
- **No photo upload in recipe detail** — Photo upload is only available in create/edit mode (recipe/create.vue), not in the detail view.
