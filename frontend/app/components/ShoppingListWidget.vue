<template>
  <div
    v-if="!loading"
    class="rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
    :class="uncheckedCount > 0 ? 'bg-orange-pastel' : 'bg-green-pastel'"
    @click="$emit('view')"
  >
    <div>
      <div class="flex items-center gap-2 mb-1">
        <PhShoppingCart class="w-5 h-5" :class="uncheckedCount > 0 ? 'text-app-black' : 'text-green-700'" weight="fill" />
        <p class="text-[12px] font-medium text-app-black/60 uppercase tracking-wide">Shopping List</p>
      </div>
      <p class="text-[14px] font-semibold text-app-black">
        {{ uncheckedCount > 0 ? `${uncheckedCount} items to buy` : 'All done \u2713' }}
      </p>
    </div>
    <PhCaretRight class="w-5 h-5 text-app-black/40" weight="bold" />
  </div>

  <div v-else class="rounded-2xl p-4 bg-green-pastel relative overflow-hidden">
    <div class="h-3 w-20 bg-white/60 rounded-full animate-pulse" />
    <div class="h-5 w-28 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>
</template>

<script setup lang="ts">
import { PhShoppingCart, PhCaretRight } from '@phosphor-icons/vue'

interface ShoppingItem {
  id: string
  is_checked: boolean
}

const { request } = useDirectus()
const { user } = useAuth()

const loading = ref(true)
const uncheckedCount = ref(0)

defineEmits<{ view: [] }>()

onMounted(async () => {
  if (!user.value) { loading.value = false; return }
  try {
    const items = await request<ShoppingItem[]>('GET',
      `/items/shopping_list_items?filter[user][_eq]=${user.value.id}&filter[is_checked][_eq]=false&fields=id&limit=100`
    )
    uncheckedCount.value = items?.length ?? 0
  } catch {
    uncheckedCount.value = 0
  }
  loading.value = false
})
</script>
