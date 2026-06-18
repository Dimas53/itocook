/**
 * Minimum fields a recipe item must have for deduplication.
 */
export interface DedupItem {
  id: string
  dish_name: string
  forked_from: string | null
  date_created: string
}

/**
 * Deduplicate recipes by `dish_name`.
 *
 * When multiple recipes share the same dish name (e.g. original + forks),
 * returns only the most recent fork if any forks exist, otherwise the most
 * recent original.
 *
 * **Why this matters:** Each cook who forks a recipe creates a new record.
 * Without dedup, recipe lists would show N copies of "Spaghetti Carbonara"
 * — one per cook who has ever made it.
 *
 * **Callers:**
 * - `pages/index.vue` — recent dishes
 * - `pages/kitchen.vue` — dish history
 * - `pages/recipes.vue` — all recipes grid
 * - `pages/cook.vue` — recipe autocomplete candidates
 *
 * **Edge cases:**
 * - Recipes with empty/null `dish_name` are silently skipped.
 * - Within each group, forks are preferred over originals.
 * - Tie-breaking: most recent `date_created` wins.
 *
 * @param recipes Array of recipe-like items (must have id, dish_name, forked_from, date_created).
 * @returns Deduplicated array — at most one entry per dish_name.
 */
export function dedupRecipes<T extends DedupItem>(recipes: T[]): T[] {
  const groups = new Map<string, T[]>()
  for (const r of recipes) {
    if (!r.dish_name) continue
    const existing = groups.get(r.dish_name) ?? []
    existing.push(r)
    groups.set(r.dish_name, existing)
  }
  const result: T[] = []
  for (const group of groups.values()) {
    const forks = group.filter(r => r.forked_from)
    if (forks.length > 0) {
      forks.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      result.push(forks[0]!)
    } else {
      group.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      result.push(group[0]!)
    }
  }
  return result
}
