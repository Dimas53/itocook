import type { Ref } from 'vue'

interface RecipeServingsData {
  servings?: number | null
  ingredients?: Array<{ name?: string; amount?: string | null; unit?: string | null }>
}

/**
 * Composable for recipe serving-size scaling.
 * Provides scale helpers, serving presets, and persistence to `recipes` collection.
 */
export function useRecipeServings(recipe: Ref<RecipeServingsData | null>) {
  const { request } = useDirectus()
  const route = useRoute()

  const baseServings = computed(() => recipe.value?.servings ?? 4)
  const currentServings = ref<number | null>(null)
  const activeServings = computed(() => currentServings.value ?? baseServings.value)

  const showCustomServings = ref(false)
  const customServingsInput = ref('')
  const savingServings = ref(false)

  const servingsPresets = computed(() => {
    const base = baseServings.value
    return [base, base * 2, base * 3].filter(n => n <= 100)
  })

  const spiceUnits = ['tsp', 'tbsp', 'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'tsp.', 'tbsp.', 'pinch']

  /** Returns true if the unit is a spice (volume) unit (not scaled linearly). */
  function isSpiceUnit(unit: string | null | undefined): boolean {
    if (!unit) return false
    return spiceUnits.includes(unit.toLowerCase())
  }

  /** Scale ingredient amount by the current activeServings ratio. */
  function scaleAmount(amount: string | null, unit: string | null): string {
    if (!amount) return '—'
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    const ratio = activeServings.value / baseServings.value
    const scaled = num * ratio
    const wholeUnits = ['pcs', 'pc', 'piece', 'pieces', 'stück', 'шт', 'шт.', 'item']
    if (unit && wholeUnits.includes(unit.toLowerCase())) {
      return String(Math.ceil(scaled))
    }
    return parseFloat(scaled.toFixed(1)).toString()
  }

  const isScaling = computed(() => currentServings.value !== null && currentServings.value !== baseServings.value)

  /** Scale amount by arbitrary ratio (used when persisting new base servings). */
  function scaleAmountRaw(amount: string | null | undefined, unit: string | null | undefined, ratio: number): string {
    if (!amount) return ''
    const num = parseFloat(amount)
    if (isNaN(num)) return amount
    const scaled = num * ratio
    const wholeUnits = ['pcs', 'pc', 'piece', 'pieces', 'stück', 'шт', 'шт.', 'item']
    if (unit && wholeUnits.includes(unit.toLowerCase())) {
      return String(Math.ceil(scaled))
    }
    return parseFloat(scaled.toFixed(1)).toString()
  }

  /** Persist new base servings and scaled ingredients to the recipe via API. */
  async function saveServingsToRecipe(newServings: number) {
    const r = recipe.value
    if (!r || !r.ingredients) return
    const oldBase = r.servings ?? 4
    if (newServings === oldBase) return
    savingServings.value = true
    const ratio = newServings / oldBase
    const scaledIngredients = r.ingredients.map(ing => ({
      ...ing,
      amount: scaleAmountRaw(ing.amount, ing.unit, ratio),
    }))
    try {
      await request('PATCH', `/items/recipes/${route.params.id}`, {
        servings: newServings,
        ingredients: scaledIngredients,
      })
      r.servings = newServings
      r.ingredients = scaledIngredients
      currentServings.value = null
    } catch { /* ignore */ }
    savingServings.value = false
  }

  /** Select a preset serving size and persist. */
  function selectServing(n: number) {
    if (recipe.value && n === (recipe.value.servings ?? 4)) return
    saveServingsToRecipe(n)
    showCustomServings.value = false
  }

  /** Apply a custom (non-preset) serving size and persist. */
  function applyCustomServing() {
    const v = parseInt(customServingsInput.value, 10)
    if (isNaN(v) || v < 1 || v > 100) return
    saveServingsToRecipe(v)
    showCustomServings.value = false
  }

  /** Compute the ratio needed to scale from base to target servings. */
  function getScaleRatio(targetServings: number): number {
    return targetServings / baseServings.value
  }

  return {
    baseServings,
    activeServings,
    currentServings,
    servingsPresets,
    isScaling,
    showCustomServings,
    customServingsInput,
    savingServings,
    saveServingsToRecipe,
    selectServing,
    applyCustomServing,
    isSpiceUnit,
    scaleAmount,
    scaleAmountRaw,
    getScaleRatio,
  }
}
