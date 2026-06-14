<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center gap-3 px-5 pb-4">
      <button
        class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-[0.98]"
        @click="router.back()"
      >
        <PhCaretLeft class="w-5 h-5 text-app-black" weight="bold" />
      </button>
      <h1 class="text-[20px] font-semibold text-app-black">All Recipes</h1>
    </div>

    <div class="pb-[100px] space-y-4">
      <div class="relative px-5">
        <PhMagnifyingGlass class="absolute left-9 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search recipes..."
          class="w-full h-12 rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      <div class="px-4">
        <select
          v-model="selectedCategory"
          class="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-[14px] text-app-black appearance-none"
        >
          <option value="">All categories</option>
          <option value="Salad">Salad</option>
          <option value="Soup">Soup</option>
          <option value="Pasta">Pasta</option>
          <option value="Meat">Meat</option>
          <option value="Fish">Fish</option>
          <option value="Pizza">Pizza</option>
          <option value="Dessert">Dessert</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div v-if="loading" class="grid grid-cols-3 gap-3 px-4">
        <div v-for="i in 6" :key="i" class="bg-primary-light rounded-2xl overflow-hidden">
          <div class="h-[90px] bg-gray-200 animate-pulse" />
          <div class="p-2 space-y-1.5">
            <div class="h-3 bg-gray-200 rounded animate-pulse" />
            <div class="h-2.5 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>

      <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-20">
        <p class="text-[14px] text-gray-400">No recipes found</p>
      </div>

      <div v-else class="grid grid-cols-3 gap-3 px-4">
        <RecipeGridItem
          v-for="r in filtered"
          :key="r.id"
          :recipe="r"
          @click="router.push('/recipe/' + r.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhMagnifyingGlass } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { request } = useDirectus()

const loading = ref(true)
const recipes = ref<{ id: string; dish_name: string; chef: string; category: string | null; photo: string | null; likeCount: number }[]>([])
const searchQuery = ref('')
const selectedCategory = ref('')

onMounted(async () => {
  try {
    const items = await request<any[]>('get',
      '/items/recipes?fields=id,dish_name,category,photo,user_created.first_name,user_created.last_name&sort=-date_created&limit=100'
    )
    const mapped = items.map((item: any) => ({
      id: item.id,
      dish_name: item.dish_name,
      chef: `${item.user_created?.first_name ?? ''} ${item.user_created?.last_name ?? ''}`.trim() || 'Unknown',
      category: item.category ?? null,
      photo: item.photo ?? null,
    }))
    const ids = mapped.map((r) => r.id)
    const likes = ids.length > 0
      ? await request<{ recipe: string }[]>('get',
        `/items/recipe_likes?fields=recipe&filter[recipe][_in]=${ids.join(',')}&limit=500`
      )
      : []
    const countMap: Record<string, number> = {}
    for (const like of likes) {
      countMap[like.recipe] = (countMap[like.recipe] || 0) + 1
    }
    recipes.value = mapped.map((r) => ({ ...r, likeCount: countMap[r.id] ?? 0 }))
  } catch {
    // Directus may not be available
  }
  loading.value = false
})

const filtered = computed(() => {
  let result = recipes.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((r) => r.dish_name.toLowerCase().includes(q))
  }
  if (selectedCategory.value) {
    const cat = selectedCategory.value.toLowerCase()
    result = result.filter((r) => r.category?.toLowerCase() === cat)
  }
  return result
})
</script>
