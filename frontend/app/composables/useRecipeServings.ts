import type { Ref } from 'vue'

interface RecipeServingsData {
  servings?: number | null
  ingredients?: Array<{ name?: string; amount?: string | null; unit?: string | null }>
}

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
    const presets = [10, 15, 20]
    if (!presets.includes(base)) {
      return [...presets.slice(0, -1), base]
    }
    return presets
  })

  const spiceUnits = ['tsp', 'tbsp', 'teaspoon', 'teaspoons', 'tablespoon', 'tablespoons', 'tsp.', 'tbsp.', 'ч.л.', 'ч.л', 'ст.л.', 'ст.л', 'щепотка', 'pinch']

  function isSpiceUnit(unit: string | null | undefined): boolean {
    if (!unit) return false
    return spiceUnits.includes(unit.toLowerCase())
  }

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

  function selectServing(n: number) {
    if (recipe.value && n === (recipe.value.servings ?? 4)) return
    saveServingsToRecipe(n)
    showCustomServings.value = false
  }

  function applyCustomServing() {
    const v = parseInt(customServingsInput.value, 10)
    if (isNaN(v) || v < 1 || v > 100) return
    saveServingsToRecipe(v)
    showCustomServings.value = false
  }

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
