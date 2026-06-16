<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-12 pb-4">
      <h1 class="text-[28px] font-bold text-app-black">Shopping List</h1>
      <div class="flex items-center gap-2">
        <button
          v-if="checkedCount > 0"
          class="h-8 px-3 rounded-full bg-red-50 text-red-500 text-[12px] font-semibold flex items-center gap-1 active:scale-[0.98] transition-transform"
          @click="clearChecked"
        >
          <PhTrash class="w-3.5 h-3.5" />
          Delete {{ checkedCount }}
        </button>
        <button
          class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-[0.98] transition-transform"
          @click="router.push('/kitchen')"
        >
          <PhX class="w-5 h-5 text-app-black" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-5 pb-4">
      <div class="bg-primary-pale rounded-full p-1 flex">
        <button
          @click="activeTab = 'by-recipe'"
          class="flex-1 h-9 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
          :class="activeTab === 'by-recipe' ? 'bg-primary text-white' : 'text-primary/60'"
        >
          <PhListBullets v-if="activeTab === 'by-recipe'" class="w-4 h-4" weight="fill" />
          By Recipe
        </button>
        <button
          @click="activeTab = 'all'"
          class="flex-1 h-9 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
          :class="activeTab === 'all' ? 'bg-primary text-white' : 'text-primary/60'"
        >
          <PhRows v-if="activeTab === 'all'" class="w-4 h-4" weight="fill" />
          All Items
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="px-5 pb-8 flex-1">
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="h-12 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="items.length === 0"
        class="flex flex-col items-center justify-center pt-16"
      >
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <PhShoppingCart class="w-8 h-8 text-red-400" />
        </div>
        <p class="text-[14px] font-semibold text-gray-400 mt-4">No items yet</p>
        <p class="text-[12px] text-gray-400 mt-1">Add ingredients from any recipe you're cooking</p>
      </div>

      <!-- By Recipe view -->
      <template v-else-if="activeTab === 'by-recipe'">
        <div v-for="group in groupedItems" :key="group.recipeName" class="mb-5">
          <!-- Group header with select-all -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <button
                class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
                :class="group.isAllChecked ? 'bg-primary border-primary' : 'border-gray-300'"
                @click="toggleGroup(group)"
              >
                <PhCheck v-if="group.isAllChecked" class="w-3.5 h-3.5 text-white" weight="bold" />
                <span v-else class="w-2 h-2 rounded-sm border border-gray-300" />
              </button>
              <p class="text-[16px] font-semibold text-app-black truncate">{{ group.recipeName }}</p>
            </div>
            <p v-if="group.cookDate" class="text-[12px] text-primary/60 font-medium shrink-0 ml-3">{{ formatDate(group.cookDate) }}</p>
          </div>
          <TransitionGroup name="list" tag="div" class="space-y-1">
            <div
              v-for="item in group.items"
              :key="item.id"
              class="flex items-center gap-3 py-2 transition-all duration-300"
              :class="item.is_checked ? 'opacity-60' : ''"
            >
              <button
                class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
                :class="item.is_checked ? 'bg-primary border-primary' : 'border-gray-300'"
                @click="toggleItem(item)"
              >
                <PhCheck v-if="item.is_checked" class="w-3.5 h-3.5 text-white" weight="bold" />
              </button>
              <span class="text-[16px] shrink-0 w-6 text-center">{{ item.emoji || '🍽️' }}</span>
              <span
                class="text-[14px] flex-1 min-w-0"
                :class="item.is_checked ? 'line-through text-gray-400' : 'text-app-black'"
              >
                {{ item.ingredient_name }}
              </span>
              <span
                class="text-[13px] shrink-0 whitespace-nowrap"
                :class="item.is_checked ? 'text-gray-300' : 'text-gray-500'"
              >
                {{ formatAmount(item.amount) }} {{ item.unit || '' }}
              </span>
            </div>
          </TransitionGroup>
        </div>
      </template>

      <!-- All items view -->
      <template v-else>
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button
              class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
              :class="allChecked ? 'bg-primary border-primary' : 'border-gray-300'"
              @click="toggleAllItems"
            >
              <PhCheck v-if="allChecked" class="w-3.5 h-3.5 text-white" weight="bold" />
              <span v-else class="w-2 h-2 rounded-sm border border-gray-300" />
            </button>
            <p class="text-[14px] text-app-black font-medium">{{ items.length }} items</p>
          </div>
          <button
            v-if="checkedCount > 0"
            class="h-8 px-3 rounded-full bg-red-50 text-red-500 text-[12px] font-semibold flex items-center gap-1 active:scale-[0.98] transition-transform"
            @click="clearChecked"
          >
            <PhTrash class="w-3.5 h-3.5" />
            Delete all checked
          </button>
        </div>
        <TransitionGroup name="list" tag="div" class="space-y-1">
          <div
            v-for="item in sortedAllItems"
            :key="item.id"
            class="flex items-center gap-3 py-2 transition-all duration-300"
            :class="item.is_checked ? 'opacity-60' : ''"
          >
            <button
              class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 active:scale-[0.98] transition-transform"
              :class="item.is_checked ? 'bg-primary border-primary' : 'border-gray-300'"
              @click="toggleItem(item)"
            >
              <PhCheck v-if="item.is_checked" class="w-3.5 h-3.5 text-white" weight="bold" />
            </button>
            <span class="text-[16px] shrink-0 w-6 text-center">{{ item.emoji || '🍽️' }}</span>
            <span
              class="text-[14px] flex-1 min-w-0"
              :class="item.is_checked ? 'line-through text-gray-400' : 'text-app-black'"
            >
              {{ item.ingredient_name }}
            </span>
            <span
              class="text-[13px] shrink-0 whitespace-nowrap"
              :class="item.is_checked ? 'text-gray-300' : 'text-gray-500'"
            >
              {{ formatAmount(item.amount) }} {{ item.unit || '' }}
            </span>
          </div>
        </TransitionGroup>
      </template>
    </div>

    <!-- Weekly shopping: future enhancement — bulk shopping list for the whole week across all recipes -->
  </div>
</template>

<script setup lang="ts">
import { PhShoppingCart, PhTrash, PhCheck, PhX, PhListBullets, PhRows } from '@phosphor-icons/vue'

definePageMeta({ layout: 'default' })

interface ShoppingItem {
  id: string
  user: string
  recipe: string | null
  recipe_name: string | null
  ingredient_name: string
  amount: string | null
  unit: string | null
  emoji: string | null
  is_checked: boolean
  sort: number | null
  date_created: string
  cook_date: string | null
}

interface ItemGroup {
  recipeName: string
  cookDate: string | null
  items: ShoppingItem[]
}

const router = useRouter()
const { request } = useDirectus()
const { user } = useAuth()

const loading = ref(true)
const items = ref<ShoppingItem[]>([])
const activeTab = ref<'by-recipe' | 'all'>('by-recipe')

const checkedCount = computed(() => items.value.filter(i => i.is_checked).length)

const allChecked = computed(() => items.value.length > 0 && items.value.every(i => i.is_checked))

const groupedItems = computed(() => {
  const groups = new Map<string, { items: ShoppingItem[]; cookDates: Set<string> }>()

  for (const item of items.value) {
    const name = item.recipe_name || 'Other'
    if (!groups.has(name)) groups.set(name, { items: [], cookDates: new Set() })
    const g = groups.get(name)!
    g.items.push(item)
    if (item.cook_date) g.cookDates.add(item.cook_date)
  }

  const result: ItemGroup[] = []
  for (const [recipeName, g] of groups) {
    const sortedDates = [...g.cookDates].sort()
    const sortedItems = [...g.items].sort((a, b) => {
      if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1
      return new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
    })
    result.push({
      recipeName,
      cookDate: sortedDates[0] ?? null,
      items: sortedItems,
    })
  }
  return result
})

const sortedAllItems = computed(() => {
  return [...items.value].sort((a, b) => {
    if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1
    return new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
  })
})

function formatAmount(amount: string | null): string {
  if (!amount) return ''
  const num = parseFloat(amount)
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2).replace(/\.?0+$/, '')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

async function toggleItem(item: ShoppingItem) {
  const newChecked = !item.is_checked
  try {
    await request('PATCH', `/items/shopping_list_items/${item.id}`, { is_checked: newChecked })
    item.is_checked = newChecked
  } catch {
    // silently fail
  }
}

function toggleGroup(group: ItemGroup) {
  const allDone = group.items.every(i => i.is_checked)
  const target = !allDone
  group.items.forEach(item => {
    if (item.is_checked !== target) {
      item.is_checked = target
      request('PATCH', `/items/shopping_list_items/${item.id}`, { is_checked: target }).catch(() => {})
    }
  })
}

function toggleAllItems() {
  const target = !allChecked.value
  items.value.forEach(item => {
    if (item.is_checked !== target) {
      item.is_checked = target
      request('PATCH', `/items/shopping_list_items/${item.id}`, { is_checked: target }).catch(() => {})
    }
  })
}

async function clearChecked() {
  const checked = items.value.filter(i => i.is_checked)
  if (checked.length === 0) return
  try {
    await Promise.all(
      checked.map(item => request('DELETE', `/items/shopping_list_items/${item.id}`))
    )
    items.value = items.value.filter(i => !i.is_checked)
  } catch {
    // silently fail
  }
}

onMounted(async () => {
  if (!user.value) { loading.value = false; return }
  try {
    const data = await request<ShoppingItem[]>('GET',
      `/items/shopping_list_items?filter[user][_eq]=${user.value.id}&fields=*&sort=sort,date_created`
    )
    items.value = data || []
  } catch {
    items.value = []
  }
  loading.value = false
})
</script>

<style scoped>
.list-move {
  transition: all 0.3s ease;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
