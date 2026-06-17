import type { Ref } from 'vue'

export interface DeductionParams {
  cookEntry: { id: string; dish_name: string | null; date: string; recipe: string | null }
  participants: { id: string }[]
  receiptAmount: string
  pastaCost: number
  dateStr: string
  userId: string | undefined
}

interface BalanceEntry {
  id: string
  user: string
  amount: string
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
      const recipe = await request<{ pasta_packages: number | null }>('get',
        `/items/recipes/${recipeId}?fields=pasta_packages`
      )
      const packages = recipe.pasta_packages ?? 0
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
      await Promise.all(participants.map(p =>
        request('post', '/items/transactions', {
          user: p.id,
          amount: -share,
          type: 'debit',
          description: `Lunch ${dateStr}: ${cookEntry.dish_name || 'Office lunch'}`,
          date: new Date().toISOString(),
        })
      ))

      const ids = participants.map(p => p.id)
      const allBalances = await request<BalanceEntry[]>('get',
        `/items/balances?filter[user][_in]=${ids.join(',')}&limit=${ids.length}`
      )
      const balanceMap = new Map(allBalances.map(b => [b.user, b]))

      await Promise.all(participants.map(p => {
        const existing = balanceMap.get(p.id)
        if (existing) {
          return request('PATCH', `/items/balances/${existing.id}`, {
            amount: parseFloat(existing.amount) - share,
          })
        }
        return request('post', '/items/balances', {
          user: p.id,
          amount: -share,
        })
      }))

      await request('PATCH', `/items/cook_queue/${cookEntry.id}`, { status: 'completed' })

      await cleanupShoppingList({ recipe: cookEntry.recipe, dishName: cookEntry.dish_name, cookDate: cookEntry.date, userId })
    } catch (e) {
      deducting.value = false
      throw e
    }
    deducting.value = false
  }

  return { deducting, pastaCost, pastaBreakdown, loadPastaCost, confirmDeduction, cleanupShoppingList }
}
