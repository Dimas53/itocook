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
        @join="onJoin"
        @decline="onDecline"
        @become-cook="onBecomeCook"
      />

      <!-- Participant counter -->
      <div v-if="!heroLoading" class="flex items-center gap-2 px-1">
        <PhUsers class="w-4 h-4 text-app-black/60" weight="fill" />
        <p class="text-[13px] text-app-black/60">
          <span class="font-semibold text-app-black">{{ participantCount }}</span> of
          <span class="font-semibold text-app-black">{{ totalCount }}</span> confirmed
        </p>
      </div>

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

definePageMeta({ layout: 'app' })

const router = useRouter()
const { user } = useAuth()
const { request, tokenCookie } = useDirectus()

// Hero state
const heroLoading = ref(true)
const todayCook = ref<{ name: string; dish?: string; status?: string } | null>(null)

// Participant counter (static for now)
const participantCount = ref(3)
const totalCount = ref(8)

// Duty (static for now)
const dutyLoading = ref(true)

// Search
const searchQuery = ref('')

// Recipes
const recipesLoading = ref(true)
const recipes = ref<{ title: string; chef: string; rating: number; time: string }[]>([])

const avatarUrl = computed(() =>
  `https://i.pravatar.cc/200?u=${user.value?.email}`
)

function onJoin() {
  participantCount.value = Math.min(participantCount.value + 1, totalCount.value)
}

function onDecline() {
  participantCount.value = Math.max(participantCount.value - 1, 0)
}

function onBecomeCook() {
  router.push('/cook')
}

function onSearchFocus() {
  router.push('/kitchen')
}

onMounted(async () => {
  // Fetch today's cook
  try {
    const today = new Date().toISOString().split('T')[0]!
    const cooks = await request<any[]>('get', `/items/cook_queue?filter[date][_eq]=${today}&filter[status][_neq]=cancelled&limit=1`)
    if (cooks.length > 0) {
      const cookData = cooks[0]
      let cookName = 'Chef'
      if (cookData.cook && typeof cookData.cook === 'object') {
        cookName = cookData.cook.first_name || 'Chef'
      }
      todayCook.value = {
        name: cookName,
        dish: cookData.dish_name || undefined,
        status: cookData.status || undefined,
      }
    }
  } catch {
    todayCook.value = null
  } finally {
    heroLoading.value = false
  }

  // Mock recipes
  recipes.value = [
    { title: 'Spiced Fried Chicken', chef: 'Maria', rating: 4.8, time: '45 min' },
    { title: 'Creamy Pasta Carbonara', chef: 'John', rating: 4.6, time: '30 min' },
    { title: 'Thai Green Curry', chef: 'Anna', rating: 4.9, time: '50 min' },
  ]
  recipesLoading.value = false

  // Duty done loading
  dutyLoading.value = false

  // Redirect to cook page if user is today's cook
  const token = tokenCookie.value
  if (token && user.value) {
    const today = new Date().toISOString().split('T')[0]!
    try {
      const myCook = await request<any[]>('get', `/items/cook_queue?filter[date][_eq]=${today}&filter[cook][_eq]=${user.value.id}&filter[status][_nin]=cancelled&limit=1`)
      if (myCook.length > 0) {
        await navigateTo('/cook')
      }
    } catch {
      // silently fail
    }
  }
})
</script>
