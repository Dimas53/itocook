<template>
  <div class="flex flex-col min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-5 cursor-pointer" @click="router.push('/profile')">
      <div class="flex items-center gap-3">
        <img
          :src="avatarUrl"
          alt="avatar"
          class="w-10 h-10 rounded-full bg-primary ring-2 ring-primary"
        />
        <div>
          <p class="text-[14px] text-gray-500">Hello</p>
          <p class="text-[20px] font-semibold text-app-black -mt-1">
            {{ user?.first_name || 'there' }}
          </p>
        </div>
      </div>
      <button class="w-10 h-10 flex items-center justify-center" @click.stop>
        <PhBell class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <!-- Content -->
    <div class="px-5 pb-[100px] space-y-4">
      <!-- Hero block -->
      <HeroBlock
          :loading="heroLoading"
          :cook="todayCook"
          :joined="hasJoined"
          :participant-count="participantCount"
          :total-count="totalCount"
          :recipe-id="todayRecipeId"
          :has-existing-queue="hasTodayQueue"
          @join="onJoin"
        @become-cook="onBecomeCook"
        @go-to-cook="router.push('/cook')"
      />

<!--      &lt;!&ndash; Participant counter &ndash;&gt;
      <div v-if="todayCook && !heroLoading" class="flex items-center gap-2 px-1">
        <PhUsers class="w-4 h-4 text-app-black/60" weight="fill" />
        <p class="text-[13px] text-app-black/60">
          <span class="font-semibold text-app-black">{{ participantCount }}</span> of
          <span class="font-semibold text-app-black">{{ totalCount }}</span> confirmed
        </p>
      </div>-->

      <!-- Widgets row -->
      <div class="grid grid-cols-2 gap-3">
        <BalanceWidget />
        <DutyWidget
          :loading="dutyLoading"
          name="Kitchen duty"
          date="Tomorrow, 12:00"
          @view="router.push('/duty')"
        />
      </div>

      <!-- Search bar -->
<!--      <div class="relative">
        <PhMagnifyingGlass class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search dishes..."
          class="w-full h-12 rounded-2xl bg-white border border-gray-200 pl-12 pr-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
          @focus="onSearchFocus"
        />
      </div>-->

      <!-- Section title -->
      <h2 class="text-[16px] font-semibold text-app-black">Recent Dishes</h2>

      <!-- Recipe cards list -->
      <div v-if="recipesLoading" class="space-y-3">
        <RecipeCard v-for="i in 3" :key="i" :loading="true" :recipe="undefined" />
      </div>
      <div v-else-if="recipes.length === 0" class="text-center py-8 text-gray-400 text-[14px]">
        No dishes yet
      </div>
      <div v-else class="grid grid-cols-2 gap-3">
        <RecipeCard
          v-for="recipe in recipes"
          :key="recipe.id"
          :loading="false"
          :recipe="recipe"
          @view="router.push(`/recipe/${recipe.id}`)"
        />
      </div>
    </div>

    <!-- Balance block overlay -->
    <div
      v-if="joinBlockedReason"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
      @click.self="joinBlockedReason = ''"
    >
      <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
        <h3 class="text-[16px] font-bold text-app-black mb-2">Action blocked</h3>
        <p class="text-[13px] text-app-black/70 leading-relaxed">{{ joinBlockedReason }}</p>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 h-11 rounded-full bg-primary text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="joinBlockedReason = ''"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhBell, PhUsers, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { CookInfo } from '~/components/HeroBlock.vue'
import type { Recipe } from '~/components/RecipeCard.vue'

interface DirectusRecipe {
  id: string
  dish_name: string
  category: string
  cook: { id: string; first_name: string; last_name: string }
  date_created: string
  photo: string | null
}

definePageMeta({ layout: 'app' })

const router = useRouter()
const { user } = useAuth()
const { request } = useDirectus()

// Hero state
const heroLoading = ref(true)
const todayCook = ref<CookInfo | null>(null)
const todayRecipeId = ref<string | undefined>(undefined)
const hasTodayQueue = ref(false)

// Participant counter from backend
const todayEntryId = ref<string | null>(null)
const { confirmed: participantCount, hasJoined, joinBlockedReason, join: onJoin, fetch: fetchParticipants } = useParticipants(todayEntryId)
const { count: totalCount } = useTotalUsers()

// Duty (static for now)
const dutyLoading = ref(true)

// Search
const searchQuery = ref('')

// Recipes
const recipesLoading = ref(true)
const recipes = ref<Recipe[]>([])

// Date helpers
function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayISO = formatDateISO(new Date())

const avatarUrl = computed(() =>
  `https://i.pravatar.cc/200?u=${user.value?.email}`
)

function onBecomeCook() {
  router.push('/cook?action=become')
}

function onSearchFocus() {
  router.push('/kitchen')
}

onMounted(async () => {
  // Fetch real cook_queue data
  try {
    const items = await request<any[]>('get',
      `/items/cook_queue?filter[date][_eq]=${todayISO}&filter[status][_nin]=cancelled&sort=date&fields=*,cook.id,cook.first_name,cook.last_name`
    )

    hasTodayQueue.value = items.length > 0

    // Priority: cooking > ready > scheduled
    const todayEntry = items.find((i) => i.status === 'cooking')
      || items.find((i) => i.status === 'ready')
      || items[0]

    if (todayEntry) {
      todayEntryId.value = todayEntry.id
      await fetchParticipants()
      const cookName = todayEntry.cook
        ? [todayEntry.cook.first_name, todayEntry.cook.last_name].filter(Boolean).join(' ')
        : 'Unknown'

      // Try to find matching recipe
      let heroCategory: string | null = null
      let heroPhoto: string | null = null
      if (todayEntry.dish_name) {
        try {
          const recipeMatch = await request<{ id: string; photo: string | null; category: string }[]>('get',
            `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(todayEntry.dish_name)}&limit=1&fields=id,photo,category`
          )
          const match = recipeMatch[0]
          if (match) {
            todayRecipeId.value = match.id
            heroCategory = match.category
            heroPhoto = match.photo
          }
        } catch {
          // No matching recipe found
        }
      }

      todayCook.value = {
        name: cookName,
        dish: todayEntry.dish_name || '',
        photo: heroPhoto,
        category: heroCategory,
      }

      // Check if current user is today's cook
      if (user.value && todayEntry.cook?.id === user.value.id) {
        hasJoined.value = true
      }
    }
  } catch {
    // Directus may not be available
  }
  heroLoading.value = false

  // Fetch real recipes
  try {
    const data = await request<DirectusRecipe[]>('get',
      '/items/recipes?sort=-date_created&limit=6&fields=id,dish_name,category,photo,cook.id,cook.first_name,cook.last_name,date_created'
    )
    recipes.value = data.map((r) => ({
      id: r.id,
      title: r.dish_name,
      chef: r.cook ? [r.cook.first_name, r.cook.last_name].filter(Boolean).join(' ') : 'Unknown',
      rating: 4.8,
      category: r.category,
      photo: r.photo,
    }))
  } catch {
    // Directus may not be available
  }
  recipesLoading.value = false

  dutyLoading.value = false
})
</script>
