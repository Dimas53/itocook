<script setup lang="ts">
import { PhForkKnife, PhBowlFood, PhCake } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

interface TestItem {
  id: string
  name: string
  description: string | null
  category: string | null
}

const { request } = useDirectus()

const items = ref<TestItem[]>([])
const loading = ref(true)
const error = ref('')

const categoryMeta: Record<string, { label: string; icon: object }> = {
  appetizer: { label: 'Appetizers', icon: PhForkKnife },
  main: { label: 'Main Courses', icon: PhBowlFood },
  dessert: { label: 'Desserts', icon: PhCake },
}

const grouped = computed(() => {
  const groups: Record<string, TestItem[]> = {}
  for (const item of items.value) {
    const cat = item.category ?? 'other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await request<TestItem[]>('get', '/items/test_items?sort[]=category&sort[]=name')
    items.value = data ?? []
  } catch (e) {
    error.value = 'Failed to load items'
    console.error(e)
  }
  loading.value = false
})
</script>

<template>
  <div class="h-full overflow-y-auto scrollbar-hide">
    <div class="px-5 pb-4">
      <p class="text-[14px] text-gray-500">Development</p>
      <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">Test Items</h1>
    </div>

    <div class="px-5 pb-8 space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl p-4 border border-gray-100">
          <div class="h-4 w-24 bg-gray-100 rounded-full animate-pulse mb-3" />
          <div class="space-y-2">
            <div v-for="j in 2" :key="j" class="h-12 bg-gray-50 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center text-[14px] text-red-500 py-6">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="items.length === 0" class="text-center text-[14px] text-gray-400 py-6">
        No items yet
      </div>

      <!-- Grouped Items -->
      <div v-else v-for="(group, category) in grouped" :key="category" class="space-y-3">
        <div class="flex items-center gap-2">
          <component :is="categoryMeta[category]?.icon || PhForkKnife" :size="20" weight="fill" class="text-primary" />
          <h2 class="text-[16px] font-semibold text-app-black">
            {{ categoryMeta[category]?.label || category }}
          </h2>
        </div>

        <div class="space-y-2">
          <div
            v-for="item in group"
            :key="item.id"
            class="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <p class="text-[14px] font-semibold text-app-black">{{ item.name }}</p>
            <p v-if="item.description" class="text-[12px] text-gray-500 mt-1">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
