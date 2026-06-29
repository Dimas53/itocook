/**
 * Parameters for confirmDeduction — the full financial closure of a meal.
 *
 * @property cookEntry - The cook_queue entry being closed. Needs id, dish_name (for description),
 *                       date (for description), recipe (for shopping list cleanup).
 * @property participants - Array of participant objects (must include id for share calculation).
 * @property receiptAmount - Raw receipt total as string (parsed to float internally).
 * @property pastaCost - Computed pasta add-on cost (from loadPastaCost, 0 if none).
 * @property dateStr - ISO date string used in the transaction description.
 * @property userId - Current user ID, passed to cleanupShoppingList for filtering.
 */
export interface DeductionParams {
  cookEntry: { id: string; dish_name: string | null; date: string; recipe: string | null }
  participants: { id: string }[]
  receiptAmount: string
  pastaCost: number
  dateStr: string
  userId: string | undefined
  guests?: string[]
  companyPaysAll?: boolean
}

/**
 * useDeduction — composable for meal cost deduction logic.
 *
 * Extracted from cook.vue during Phase 1-2 refactoring. Manages the financial
 * closure of a meal: splitting the total cost (receipt + pasta add-on) among
 * participants, creating transactions, updating balances, and cleaning up
 * shopping list items.
 *
 * All direct Directus writes (transactions, balances) go through a Nuxt admin-proxy
 * server route (POST /api/deduction/confirm) — NOT through useDirectus.request().
 * This is a security measure: regular user tokens cannot write to other users'
 * balances/transactions.
 *
 * Directus collections:
 *  - READ: recipes (pasta_packages, ingredients), app_settings (pasta_price)
 *  - READ/DELETE: shopping_list_items (cleanup after deduction)
 *  - WRITE (admin-proxy): balances, transactions
 *
 * Callers:
 *  - cook.vue (the primary consumer) — calls confirmDeduction, loadPastaCost, cleanupShoppingList
 *  - cancelCooking in cook.vue — directly calls cleanupShoppingList
 *
 * IMPORTANT: Returns a PLAIN object with ref properties. Callers MUST wrap with
 * reactive() in templates, e.g.: `const deduction = reactive(useDeduction())`.
 * Without reactive(), Vue will NOT auto-unwrap refs in templates.
 */
export function useDeduction() {
  const { request } = useDirectus()
  const mealCost = useMealCost()

  /** True while the deduction POST is in progress (disables the confirm button). */
  const deducting = ref(false)

  /**
   * Computed pasta add-on cost in EUR.
   * Set by loadPastaCost(). 0 if no pasta packages or recipe has no link.
   */
  const pastaCost = ref(0)

  /**
   * Breakdown line for the UI: { label, amount } or null if no pasta.
   * Displayed as a separate line in ReceiptSummary and deduction preview.
   */
  const pastaBreakdown = ref<{ label: string; amount: number } | null>(null)

  /**
   * Load the pasta package cost for a given recipe.
   *
   * Derives the package count from TWO sources (priority order):
   *   1. Ingredients array — finds entry whose name is "pasta" and parses its amount.
   *   2. recipes.pasta_packages field — fallback if no pasta entry in ingredients.
   *
   * Then fetches the pasta_package_price from app_settings singleton
   * (via useMealCost.fetchPastaPrice()) to compute the cost.
   *
   * Sets pastaCost and pastaBreakdown refs. If recipeId is null or no pasta
   * is found, both are reset to 0/null.
   *
   * Called by cook.vue via watch(existingRecipeId) — updates the deduction
   * preview whenever the linked recipe changes.
   *
   * @param recipeId - Recipe UUID, or null to reset
   */
  async function loadPastaCost(recipeId: string | null) {
    if (!recipeId) {
      pastaCost.value = 0
      pastaBreakdown.value = null
      return
    }
    try {
      const recipe = await request<{ pasta_packages: number | null; ingredients: { name: string; amount: string; unit: string }[] | string | null }>('get',
        `/items/recipes/${recipeId}?fields=pasta_packages,ingredients`
      )
      const ings = parseJsonField(recipe.ingredients) ?? []
      const pastaEntry = Array.isArray(ings) ? ings.find((i: { name: string }) => i.name.trim().toLowerCase() === 'pasta') : null
      const packages = pastaEntry ? parseInt(pastaEntry.amount, 10) || 0 : (recipe.pasta_packages ?? 0)
      if (packages > 0) {
        const price = await mealCost.fetchPastaPrice()
        const cost = mealCost.computePastaCost(packages, price)
        pastaCost.value = cost
        pastaBreakdown.value = {
          label: `Pasta (${packages} package${packages > 1 ? 's' : ''})`,
          amount: cost,
        }
      } else {
        pastaCost.value = 0
        pastaBreakdown.value = null
      }
    } catch {
      pastaCost.value = 0
      pastaBreakdown.value = null
    }
  }

  /**
   * Delete shopping list items for a given recipe or dish.
   *
   * Two lookup strategies (tried in order):
   *   1. By recipe UUID — most precise, used when cook_queue has a linked recipe.
   *   2. By dish_name + cook_date — fallback when no recipe is linked (dish-only entry).
   *
   * Uses Promise.all for parallel DELETE calls. Silently catches all errors —
   * shopping list cleanup is best-effort and non-critical for the deduction flow.
   *
   * Called by:
   *  - confirmDeduction() — after successful deduction
   *  - cancelCooking() in cook.vue — when cook cancels the entry
   */
  async function cleanupShoppingList(params: {
    recipe: string | null
    dishName: string | null
    cookDate: string | null
    userId: string | undefined
  }) {
    try {
      if (params.recipe) {
        const items = await request<{ id: number }[]>('GET',
          `/items/shopping_list_items?filter[user][_eq]=${params.userId}&filter[recipe][_eq]=${params.recipe}&fields=id&limit=200`
        )
        if (items?.length) await Promise.all(items.map(i => request('DELETE', `/items/shopping_list_items/${i.id}`)))
      } else if (params.dishName && params.cookDate) {
        const items = await request<{ id: number }[]>('GET',
          `/items/shopping_list_items?filter[user][_eq]=${params.userId}&filter[recipe_name][_eq]=${encodeURIComponent(params.dishName)}&filter[cook_date][_eq]=${params.cookDate}&fields=id&limit=200`
        )
        if (items?.length) await Promise.all(items.map(i => request('DELETE', `/items/shopping_list_items/${i.id}`)))
      }
    } catch { /* non-critical */ }
  }

  /**
   * Confirm deduction — close the meal's financial cycle.
   *
   * Computes the per-person share: (receipt + pastaCost) / participants.length.
   * Then POSTs to the Nuxt admin-proxy (POST /api/deduction/confirm) which
   * creates transactions and updates balances using an admin Directus token.
   * The proxy handles the actual Directus writes to /items/transactions and
   * /items/balances — user tokens don't have permission to write to other users'
   * financial records.
   *
   * On success: cleans up shopping list items for the recipe.
   * On failure: resets deducting flag and re-throws the error.
   *
   * Does NOT update cook_queue status here — that's done by the caller
   * (handleConfirmDeduction in cook.vue sets status='completed' locally
   * and flips deductionResult to trigger the 'done' state).
   *
   * @throws {Error} If the admin-proxy returns a non-2xx response
   */
  async function confirmDeduction(params: DeductionParams) {
    const { cookEntry, participants, receiptAmount: rawAmount, pastaCost: pasta, dateStr, userId, guests, companyPaysAll } = params
    if (participants.length === 0 && !companyPaysAll) return
    deducting.value = true

    const baseTotal = parseFloat(rawAmount)
    const grandTotal = baseTotal + pasta
    const guestNames = guests ?? []
    const totalParticipants = participants.length + guestNames.length

    try {
      const res = await fetch('/api/deduction/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookQueueId: cookEntry.id,
          participants: participants.map(p => ({ id: p.id, share: 0 })),
          totalAmount: grandTotal,
          cookId: userId,
          description: `Lunch ${dateStr}: ${cookEntry.dish_name || 'Office lunch'}`,
          guests: guestNames,
          companyPaysAll: companyPaysAll ?? false,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.message || 'Deduction failed')
      }

      await cleanupShoppingList({ recipe: cookEntry.recipe, dishName: cookEntry.dish_name, cookDate: cookEntry.date, userId })
    } catch (e) {
      deducting.value = false
      throw e
    }
    deducting.value = false
  }

  return { deducting, pastaCost, pastaBreakdown, loadPastaCost, confirmDeduction, cleanupShoppingList }
}
