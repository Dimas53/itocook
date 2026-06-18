export interface DeductionParams {
  cookEntry: { id: string; dish_name: string | null; date: string; recipe: string | null }
  participants: { id: string }[]
  receiptAmount: string
  pastaCost: number
  dateStr: string
  userId: string | undefined
}

export function useDeduction() {
  const { request } = useDirectus()
  const mealCost = useMealCost()

  const deducting = ref(false)
  const pastaCost = ref(0)
  const pastaBreakdown = ref<{ label: string; amount: number } | null>(null)

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

  async function confirmDeduction(params: DeductionParams) {
    const { cookEntry, participants, receiptAmount: rawAmount, pastaCost: pasta, dateStr, userId } = params
    if (participants.length === 0) return
    deducting.value = true

    const baseTotal = parseFloat(rawAmount)
    const grandTotal = baseTotal + pasta
    const share = grandTotal / participants.length

    try {
      const res = await fetch('/api/deduction/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookQueueId: cookEntry.id,
          participants: participants.map(p => ({ id: p.id, share })),
          totalAmount: grandTotal,
          cookId: userId,
          description: `Lunch ${dateStr}: ${cookEntry.dish_name || 'Office lunch'}`,
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
