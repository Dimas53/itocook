<template>
  <div
    v-if="show"
    class="absolute inset-0 z-50 flex flex-col justify-end"
  >
    <div class="absolute inset-0 bg-black/30" @click="close" />
    <div
      class="relative bg-white rounded-t-2xl shadow-sm pb-8 px-5 pt-5 max-h-[85%] flex flex-col"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 shrink-0" />
      <h3 class="text-[14px] font-semibold text-app-black mb-3 shrink-0">Add ingredient</h3>
      <div class="overflow-y-auto scrollbar-hide -mx-5 px-5">
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          @click="selectCustom"
        >
          <span class="text-lg w-6 text-center">✏️</span>
          <span class="text-[14px] font-medium text-app-black">Custom ingredient</span>
        </button>
        <div class="h-px bg-gray-100 my-1" />
        <div class="space-y-1">
          <div v-for="(cat, ci) in INGREDIENT_CATEGORIES" :key="ci">
            <button
              class="w-full flex items-center justify-between px-3 py-2.5 bg-app-bg rounded-xl active:scale-[0.98] transition-transform"
              @click="toggleCategory(ci)"
            >
              <span class="flex items-center gap-2">
                <span class="text-base">{{ cat.icon }}</span>
                <span class="text-[14px] font-semibold text-app-black">{{ cat.label }}</span>
              </span>
              <span class="text-[12px] text-app-black/40 transition-transform" :class="expandedCategories.has(ci) ? 'rotate-180' : ''">▼</span>
            </button>
            <div v-if="expandedCategories.has(ci)" class="overflow-hidden">
              <div
                v-for="(item, ii) in cat.items"
                :key="ii"
                class="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0"
                :class="isDisabled(item) ? 'opacity-40 pointer-events-none cursor-not-allowed' : 'active:scale-[0.98] transition-transform cursor-pointer'"
                @click="selectIngredient(item)"
              >
                <span class="flex items-center gap-2.5">
                  <span class="text-lg w-6 text-center shrink-0">{{ item.icon }}</span>
                  <span class="text-[13px] text-app-black">{{ item.name }}</span>
                </span>
                <span v-if="isDisabled(item)" class="text-[12px] text-green-600 font-medium">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Bottom-sheet popover for selecting ingredients from predefined categories.
 * Pure UI — uses static ingredient data, no collections.
 */
import { INGREDIENT_CATEGORIES, type PopularIngredient } from '~/utils/popularIngredients'

const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss(close)

const props = defineProps<{
  show: boolean
  existingIngredients?: string[]
}>()

const emit = defineEmits<{
  close: []
  select: [ingredient: PopularIngredient]
  custom: []
}>()

const expandedCategories = reactive(new Set<number>([0]))

function toggleCategory(index: number) {
  if (expandedCategories.has(index)) {
    expandedCategories.delete(index)
  } else {
    expandedCategories.clear()
    expandedCategories.add(index)
  }
}

function isDisabled(item: PopularIngredient): boolean {
  if (!props.existingIngredients) return false
  return props.existingIngredients.includes(item.name.toLowerCase())
}

function close() {
  emit('close')
}

function selectIngredient(ing: PopularIngredient) {
  if (isDisabled(ing)) return
  emit('select', ing)
  emit('close')
}

function selectCustom() {
  emit('custom')
  emit('close')
}
</script>
