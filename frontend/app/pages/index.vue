<template>
  <div class="flex flex-col min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-5 cursor-pointer" @click="router.push('/profile')">
      <div class="flex items-center gap-3">
        <img
          v-if="user?.avatar"
          :src="`${directusUrl}/assets/${user.avatar}`"
          alt="avatar"
          class="w-10 h-10 rounded-full object-cover ring-2 ring-primary"
        />
        <div
          v-else
          class="w-10 h-10 ring-2 ring-primary rounded-full overflow-hidden shrink-0"
        >
          <AvatarPlaceholder />
        </div>
        <div>
          <p class="text-[14px] text-gray-500">Hello</p>
          <p class="text-[20px] font-semibold text-app-black -mt-1">
            {{ user?.first_name || 'there' }}
          </p>
        </div>
      </div>
      <NotificationBell />
    </div>

    <!-- Content -->
    <div class="px-5 pb-[100px] space-y-4">
      <!-- Hero block -->
      <HeroBlock
          :loading="heroLoading"
          :cook="todayCook"
          :joined="hasJoined"
          :participant-count="heroParticipantCount"
          :total-count="totalCount"
          :recipe-id="todayRecipeId"
          :has-existing-queue="hasTodayQueue"
          :queue-status="todayStatus"
          @join="onJoin"
        @become-cook="onBecomeCook"
        @go-to-cook="router.push('/cook')"
        @show-participants="onShowParticipants"
      />

      <!-- Widgets row -->
      <div class="grid grid-cols-2 gap-3">
        <BalanceWidget />
        <DutyWidget @view="router.push('/duty')" />
      </div>

      <!-- Search bar -->
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
          :like-count="recipe.likeCount"
          @view="router.push(`/recipe/${recipe.id}`)"
        />
      </div>
    </div>

    <ActionBlockedModal
      :show="!!joinBlockedReason"
      :message="joinBlockedReason"
      @close="joinBlockedReason = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { PhUsers, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { CookInfo } from '~/components/HeroBlock.vue'
import type { Recipe } from '~/components/RecipeCard.vue'

interface RecipeWithLikes extends Recipe {
  likeCount: number
}

interface DirectusRecipe {
  id: string
  dish_name: string
  category: string
  cook: { id: string; first_name: string; last_name: string }
  date_created: string
  photo: string | null
  forked_from: string | null
}

definePageMeta({ layout: 'app' })

/**
 * Home page — today's cook hero block, recipe feed, widgets.
 * Touches: `recipes`, `cook_queue`, `orders`, `recipe_likes`, `balances`, `cleaning_schedule`, `shopping_list_items`.
 */
const router = useRouter()
const { user } = useAuth()
const { request } = useDirectus()
const likes = useLikes()
const config = useRuntimeConfig()
const directusUrl = config.public.directusUrl

// Hero state
const heroLoading = ref(true)
const todayCook = ref<CookInfo | null>(null)
const todayRecipeId = ref<string | undefined>(undefined)
const hasTodayQueue = ref(false)
const todayStatus = ref<string | null>(null)
const displayParticipantCount = ref(0)

// Participant counter from backend
const todayEntryId = ref<string | null>(null)
const { confirmed: participantCount, hasJoined, joinBlockedReason, join: onJoin, fetch: fetchParticipants } = useParticipants(todayEntryId)
const { count: totalCount } = useTotalUsers()

const heroParticipantCount = computed(() =>
  todayEntryId.value ? participantCount.value : displayParticipantCount.value
)

// Recipes
const recipesLoading = ref(true)
const recipes = ref<(Recipe & { likeCount: number })[]>([])

const todayISO = formatDateISO(new Date())

const pm = useParticipantsModal()

function onShowParticipants() {
  pm.open(todayCook.value?.queueId)
}

function onBecomeCook() {
  router.push('/cook?action=become')
}

async function fetchTodayHero() {
  try {
    const items = await request<any[]>('get',
      `/items/cook_queue?filter[date][_eq]=${todayISO}&filter[status][_nin]=cancelled&sort=date&fields=*,cook.id,cook.first_name,cook.last_name`
    )

    hasTodayQueue.value = items.length > 0

    // Display: shows cook + dish + badge in HeroBlock (includes ready)
    const displayEntry = items.find((i) => i.status === 'cooking')
      || items.find((i) => i.status === 'ready')
      || items.find((i) => i.status === 'scheduled')
      || null

    // Join: only allow scheduled/cooking for participant gating
    const joinEntry = items.find((i) => i.status === 'cooking')
      || items.find((i) => i.status === 'scheduled')
      || null

    todayStatus.value = displayEntry?.status ?? null

    if (joinEntry) {
      todayEntryId.value = joinEntry.id
      await fetchParticipants()
    } else if (displayEntry) {
      // ready status — fetch participants directly for display
      todayEntryId.value = null
      try {
        const orders = await request<any[]>('get',
          `/items/orders?filter[cook_queue][_eq]=${displayEntry.id}&filter[status][_eq]=confirmed&fields=id`
        )
        displayParticipantCount.value = orders.length
      } catch {
        displayParticipantCount.value = 0
      }
    }

    if (displayEntry) {
      const cookName = formatUserName(displayEntry.cook)

      let heroCategory: string | null = null
      let heroPhoto: string | null = null
      if (displayEntry.dish_name) {
        try {
          const recipeMatch = await request<{ id: string; photo: string | null; category: string }[]>('get',
            `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(displayEntry.dish_name)}&sort=-date_created&limit=1&fields=id,photo,category,forked_from`
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
        dish: displayEntry.dish_name || '',
        photo: heroPhoto,
        category: heroCategory,
        queueId: displayEntry.id,
      }

      if (user.value && displayEntry.cook?.id === user.value.id) {
        hasJoined.value = true
      }
    }
  } catch {
    // Directus may not be available
  }
  heroLoading.value = false
}

async function fetchRecipes() {
  try {
    const data = await request<DirectusRecipe[]>('get',
      '/items/recipes?sort=-date_created&limit=20&fields=id,dish_name,category,photo,cook.id,cook.first_name,cook.last_name,date_created,forked_from'
    )
    const deduped = dedupRecipes(data).slice(0, 6)
    const mapped = deduped.map((r) => ({
      id: r.id,
      title: r.dish_name,
      chef: formatUserName(r.cook),
      category: r.category,
      photo: r.photo,
    }))

    const countMap = await likes.fetchLikeCounts(mapped.map((r) => r.id))
    recipes.value = mapped.map((r) => ({ ...r, likeCount: countMap[r.id] ?? 0 }))
  } catch {
    // Directus may not be available
  }
  recipesLoading.value = false
}

onMounted(async () => {
  await fetchTodayHero()
  await fetchRecipes()
})
</script>
