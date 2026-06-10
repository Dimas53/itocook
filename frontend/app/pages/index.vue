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
          @join="onJoin"
        @become-cook="onBecomeCook"
        @view-dish="router.push('/recipe/today')"
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
      <div class="relative">
        <PhMagnifyingGlass class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search dishes..."
          class="w-full h-12 rounded-2xl bg-white border border-gray-200 pl-12 pr-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
          @focus="onSearchFocus"
        />
      </div>

      <!-- Section title -->
      <h2 class="text-[16px] font-semibold text-app-black">Recent Dishes</h2>

      <!-- Recipe cards list -->
      <div v-if="recipesLoading" class="space-y-3">
        <RecipeCard v-for="i in 3" :key="i" :loading="true" />
      </div>
      <div v-else-if="recipes.length === 0" class="text-center py-8 text-gray-400 text-[14px]">
        No dishes yet
      </div>
      <div v-else class="space-y-3">
        <RecipeCard
          v-for="(recipe, i) in recipes"
          :key="i"
          :loading="false"
          :recipe="recipe"
          @view="router.push(`/recipe/${i}`)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhBell, PhUsers, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { CookInfo } from '~/components/HeroBlock.vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { user } = useAuth()
const { request } = useDirectus()

// Hero state
const heroLoading = ref(true)
const todayCook = ref<CookInfo | null>(null)
const hasJoined = ref(false)

// Participant counter (static for now)
const participantCount = ref(0)
const totalCount = ref(0)

// Duty (static for now)
const dutyLoading = ref(true)

// Search
const searchQuery = ref('')

// Recipes
const recipesLoading = ref(true)
const recipes = ref<{ title: string; chef: string; rating: number; time: string }[]>([])

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

function onJoin() {
  if (hasJoined.value) return
  hasJoined.value = true
  participantCount.value = Math.min(participantCount.value + 1, totalCount.value)
}

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

    // Priority: cooking > ready > scheduled
    const todayEntry = items.find((i) => i.status === 'cooking')
      || items.find((i) => i.status === 'ready')
      || items[0]

    if (todayEntry) {
      const cookName = todayEntry.cook
        ? [todayEntry.cook.first_name, todayEntry.cook.last_name].filter(Boolean).join(' ')
        : 'Unknown'
      todayCook.value = {
        name: cookName,
        dish: todayEntry.dish_name || '',
        photo: '/images/salat.png',
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

  // Mock recipes
  recipes.value = [
    { title: 'Spiced Fried Chicken', chef: 'Maria', rating: 4.8, time: '45 min' },
    { title: 'Creamy Pasta Carbonara', chef: 'John', rating: 4.6, time: '30 min' },
    { title: 'Thai Green Curry', chef: 'Anna', rating: 4.9, time: '50 min' },
  ]
  recipesLoading.value = false

  dutyLoading.value = false
})
</script>
