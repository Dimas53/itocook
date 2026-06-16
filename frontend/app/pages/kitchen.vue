<template>
  <div class="flex flex-col min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Kitchen</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">Cook Queue</h1>
      </div>
      <button class="w-10 h-10 flex items-center justify-center" @click.stop>
        <PhBell class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-[100px] space-y-5">

      <!-- 1. Week calendar -->
      <WeekCalendar
        v-if="!weekLoading"
        :days="calendarDays"
        :selected-date="selectedDate"
        @select-day="selectedDate = $event"
        @prev-week="weekOffset -= 1"
        @next-week="weekOffset += 1"
      />

      <!-- 2. Compact day status -->
      <template v-if="selectedSlot?.cookName">
        <!-- Current user is the cook -->
        <div v-if="isCurrentUserCookForSelected" class="rounded-2xl bg-primary-light/50 p-4 flex items-center justify-between">
          <div>
            <p class="text-[14px] font-semibold text-app-black">You are the cook</p>
            <p v-if="selectedSlot.dishName" class="text-[12px] text-app-black/60 mt-0.5">
              {{ selectedSlot.dishName }}
            </p>
          </div>
          <button
            class="h-10 px-5 rounded-full bg-primary text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="router.push('/cook?date=' + selectedDate)"
          >
            Cook Panel →
          </button>
        </div>
        <!-- Someone else is the cook -->
        <div v-else class="rounded-2xl bg-primary-light/50 p-4 flex items-center justify-between">
          <div>
            <p class="text-[14px] font-semibold text-app-black">{{ selectedSlot.cookName }} is cooking</p>
            <p v-if="selectedSlot.dishName" class="text-[12px] text-app-black/60 mt-0.5">
              {{ selectedSlot.dishName }}
            </p>
          </div>
          <button
            disabled
            class="h-10 px-5 rounded-full bg-primary text-white font-semibold text-[14px] opacity-40 cursor-not-allowed"
          >
            Cook Panel →
          </button>
        </div>
      </template>

      <!-- 3. Today's Kitchen hero -->
      <HeroBlock
        :loading="todayLoading"
        :cook="heroCook"
        :joined="hasJoined"
        :participant-count="participantCount"
        :total-count="totalCount"
        :recipe-id="heroRecipeId"
        :has-existing-queue="hasSelectedQueue"
        @join="onJoin"
        @become-cook="onBecomeCook"
        @go-to-cook="router.push('/cook?date=' + selectedDate)"
        @show-participants="onShowParticipants"
      />

      <!-- 4. Dish history -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-[16px] font-semibold text-app-black">Dish History</h2>
          <NuxtLink to="/recipes" class="text-primary text-[14px] font-medium">
            All Recipes →
          </NuxtLink>
        </div>

        <div class="relative mb-3">
          <PhMagnifyingGlass class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search dishes..."
            class="w-full h-10 rounded-xl bg-white border border-gray-200 pl-10 pr-4 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
          />
        </div>

        <div v-if="historyLoading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-16 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        <div v-else-if="filteredHistory.length === 0" class="text-center py-8 text-gray-400 text-[14px]">
          No dishes found
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in filteredHistory"
            :key="item.id"
            class="rounded-xl bg-primary-light/50 p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
            @click="onViewDish(item)"
          >
            <div class="flex-1 min-w-0 mr-3">
              <p class="text-[14px] font-semibold text-app-black truncate">{{ item.dish_name }}</p>
              <p class="text-[12px] text-app-black/60 mt-0.5">
                by {{ item.cookName }} &middot; {{ item.dateLabel }}
              </p>
            </div>
            <span class="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
              <PhHeart :size="12" weight="fill" class="text-red-300" />
              {{ item.likeCount }}
            </span>
          </div>
      </div>
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
import { PhBell, PhChefHat, PhHeart, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { CalendarDay } from '~/components/WeekCalendar.vue'
import type { CookInfo } from '~/components/HeroBlock.vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { request } = useDirectus()
const { user } = useAuth()



// ── Types ──
interface CookQueueItem {
  id: string
  date: string
  dish_name: string | null
  category: string | null
  status: string | null
  cook: {
    id: string
    first_name: string
    last_name: string
  } | string | null
}

interface WeekSlot {
  date: string
  dayName: string
  dateStr: string
  cookName: string | null
  dishName: string | null
  queueId: string | null
  isToday: boolean
  isPast: boolean
}

interface HistoryItem {
  id: string
  dish_name: string
  cookName: string
  dateLabel: string
  likeCount: number
}

// ── State ──
const todayLoading = ref(true)
const weekLoading = ref(true)
const historyLoading = ref(true)

const heroRecipeId = ref<string | undefined>(undefined)
const selectedCategory = ref<string | null>(null)
const allItems = ref<CookQueueItem[]>([])
const historyItems = ref<HistoryItem[]>([])
const searchQuery = ref('')

const activeEntryId = computed(() => {
  if (!selectedDate.value) return null
  const dayItems = allItems.value.filter(
    (i) => i.date === selectedDate.value && i.status !== 'cancelled'
  )
  const item = dayItems.find((i) => i.status === 'cooking')
    || dayItems.find((i) => i.status === 'ready')
    || dayItems[0]
  return item?.id ?? null
})
const { confirmed: participantCount, hasJoined, joinBlockedReason, join: onJoin, fetch: fetchParticipants } = useParticipants(activeEntryId)
const { count: totalCount } = useTotalUsers()

const pm = useParticipantsModal()

function onShowParticipants() {
  pm.open(heroCook.value?.queueId)
}

// ── Week navigation ──
const weekOffset = ref(0)
const selectedDate = ref(formatDateISO(new Date()))

// ── Helpers ──
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDateStr(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getCookName(cook: CookQueueItem['cook']): string {
  if (!cook) return ''
  if (typeof cook === 'object') {
    return [cook.first_name, cook.last_name].filter(Boolean).join(' ') || 'Unknown'
  }
  return 'Unknown'
}

// ── Computed: week days ──
const currentMonday = computed(() => {
  const m = getMonday(new Date())
  m.setDate(m.getDate() + weekOffset.value * 7)
  return m
})

const weekSlots = computed<WeekSlot[]>(() => {
  const monday = currentMonday.value
  const todayISO = formatDateISO(new Date())
  const slots: WeekSlot[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = formatDateISO(d)
    const dayItems = allItems.value.filter(
      (ci) => ci.date === iso && ci.status !== 'cancelled'
    )
    const item = dayItems.find((ci) => ci.status === 'cooking')
      || dayItems.find((ci) => ci.status === 'ready')
      || dayItems[0]

    slots.push({
      date: iso,
      dayName: DAY_NAMES[i]!,
      dateStr: formatDateStr(d),
      cookName: item ? getCookName(item.cook) : null,
      dishName: item?.dish_name || null,
      queueId: item?.id ?? null,
      isToday: iso === todayISO,
      isPast: iso < todayISO,
    })
  }
  return slots
})

const calendarDays = computed<CalendarDay[]>(() =>
  weekSlots.value.map((s) => ({
    date: s.date,
    dayName: s.dayName,
    dateNum: new Date(s.date + 'T12:00:00').getDate(),
    hasActivity: !!s.cookName,
    isToday: s.isToday,
    isPast: s.isPast,
  }))
)

const selectedSlot = computed(() =>
  weekSlots.value.find((s) => s.date === selectedDate.value) ?? null
)

const selectedRecipePhoto = ref<string | null>(null)

const heroCook = computed<CookInfo | null>(() => {
  const slot = selectedSlot.value
  if (!slot || !slot.cookName) return null
  return {
    name: slot.cookName,
    dish: slot.dishName || '',
    photo: selectedRecipePhoto.value,
    category: selectedCategory.value,
    queueId: slot.queueId ?? undefined,
  }
})

const hasSelectedQueue = computed(() => {
  if (!selectedDate.value) return false
  return allItems.value.some(
    (i) => i.date === selectedDate.value && i.status !== 'cancelled'
  )
})

const isCurrentUserCookForSelected = computed(() => {
  if (!user.value || !selectedDate.value) return false
  const dayItems = allItems.value.filter(
    (i) => i.date === selectedDate.value && i.status !== 'cancelled'
  )
  const item = dayItems.find((i) => i.status === 'cooking')
    || dayItems.find((i) => i.status === 'ready')
    || dayItems[0]
  if (!item || typeof item.cook !== 'object' || !item.cook) return false
  return item.cook.id === user.value.id
})

// ── Reactive updates when selected day changes ──
watch(selectedSlot, async (slot) => {
  heroRecipeId.value = undefined
  selectedCategory.value = null
  selectedRecipePhoto.value = null
  if (!slot?.dishName) return

  try {
    const recipeMatch = await request<{ id: string; photo: string | null; category: string | null }[]>('get',
      `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(slot.dishName)}&limit=1&fields=id,photo,category`
    )
    const match = recipeMatch[0]
    if (match) {
      heroRecipeId.value = match.id
      selectedCategory.value = match.category || null
      selectedRecipePhoto.value = match.photo ?? null
    } else {
      const dayItems = allItems.value.filter(
        (i) => i.date === selectedDate.value && i.status !== 'cancelled'
      )
      const queueItem = dayItems.find((i) => i.dish_name === slot.dishName) || dayItems[0]
      if (queueItem?.category) {
        selectedCategory.value = queueItem.category
      }
    }
  } catch { /* ignore */ }
})

watch(activeEntryId, async (id) => {
  if (id) {
    await fetchParticipants()
  }
  if (isCurrentUserCookForSelected.value) {
    hasJoined.value = true
  }
})

// ── Data fetching ──
onMounted(async () => {
  const params = new URLSearchParams({
    fields: 'id,date,dish_name,status,category,cook.id,cook.first_name,cook.last_name',
    sort: 'date',
  })

  let items: CookQueueItem[] = []
  try {
    // directus api — GET /items/cook_queue with cook.id, first_name, last_name
    // Fetch the full cook queue to show:
    //   - who cooks today (Today's block)
    //   - weekly schedule (WeekCalendar)
    //   - dish history (Dish history)
    items = await request<CookQueueItem[]>('get', `/items/cook_queue?${params}`)
  } catch {
    // Directus may not be available
  }
  allItems.value = items

  // Hero data derives reactively from selectedSlot + watches
  todayLoading.value = false
  weekLoading.value = false

  // ── Dish history from real recipes ──
  try {
    const recipeData = await request<any[]>('get',
      '/items/recipes?sort=-date_created&limit=5&fields=id,dish_name,category,cook.id,cook.first_name,cook.last_name,date_created'
    )
    const mapped = recipeData.map((r) => ({
      id: r.id,
      dish_name: r.dish_name,
      cookName: r.cook ? [r.cook.first_name, r.cook.last_name].filter(Boolean).join(' ') : 'Unknown',
      dateLabel: formatDateStr(new Date(r.date_created)),
    }))

    // Batch-fetch likes
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
    historyItems.value = mapped.map((r) => ({ ...r, likeCount: countMap[r.id] ?? 0 }))
  } catch {
    // Directus may not be available
  }
  historyLoading.value = false
})

const filteredHistory = computed(() => {
  if (!searchQuery.value) return historyItems.value
  const q = searchQuery.value.toLowerCase()
  return historyItems.value.filter((i) => i.dish_name.toLowerCase().includes(q))
})

// ── Actions ──
function onBecomeCook() {
  router.push(`/cook?action=become&date=${selectedDate.value}`)
}

function onSignUp(date: string) {
  router.push(`/cook?action=become&date=${date}`)
}

function onViewDish(item: HistoryItem) {
  router.push(`/recipe/${item.id}`)
}
</script>
