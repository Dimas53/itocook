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

      <!-- 1. Today's Kitchen hero -->
      <HeroBlock
        :loading="todayLoading"
        :cook="heroCook"
        :joined="hasJoined"
        :participant-count="participantCount"
        :total-count="totalCount"
        @join="onJoin"
        @become-cook="onBecomeCook"
        @view-dish="router.push('/recipe/today')"
      />

      <!-- 2. Week calendar -->
      <WeekCalendar
        v-if="!weekLoading"
        :days="calendarDays"
        :selected-date="selectedDate"
        @select-day="selectedDate = $event"
        @prev-week="weekOffset -= 1"
        @next-week="weekOffset += 1"
      />

      <!-- 3. Selected day detail -->
      <div class="rounded-2xl bg-primary-light/50 p-5">
        <div v-if="selectedSlot">
          <p class="text-[12px] text-app-black/60 font-semibold uppercase tracking-wide mb-3">
            {{ selectedSlot.dayName }} &middot; {{ selectedSlot.dateStr }}
          </p>

          <div v-if="selectedSlot.cookName">
            <p class="text-[14px] text-app-black/70">Cooked by</p>
            <p class="text-[18px] font-bold text-app-black">{{ selectedSlot.cookName }}</p>
            <p v-if="selectedSlot.dishName" class="text-[14px] text-app-black/70 mt-1">
              Dish: <span class="font-semibold text-app-black">{{ selectedSlot.dishName }}</span>
            </p>
          </div>

          <div v-else-if="!selectedSlot.isPast" class="space-y-3">
            <p class="text-[14px] text-app-black/70">No cook assigned for this day</p>
            <button
              class="w-full h-10 rounded-full bg-primary text-white font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              @click="onSignUp(selectedSlot.date)"
            >
              <PhChefHat class="w-4 h-4" weight="fill" />
              Become a cook
            </button>
          </div>

          <div v-else>
            <p class="text-[14px] text-app-black/50">No cook was assigned</p>
          </div>
        </div>

        <div v-else-if="weekLoading" class="space-y-3">
          <div class="h-3 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div class="h-5 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div class="h-8 w-full bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>

      <!-- 4. Dish history -->
      <div>
        <h2 class="text-[16px] font-semibold text-app-black mb-3">Dish History</h2>

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
            <div class="flex items-center gap-1 shrink-0">
              <PhStar class="w-3.5 h-3.5 text-secondary" weight="fill" />
              <span class="text-[12px] font-medium text-app-black">{{ item.rating }}</span>
            </div>
          </div>
        </div>
      </div>

<!--      test api-->
      <div>
        <div v-for="item in items" :key="item.id">
          {{ item.dish_name }} — {{ item.amount }}€ ({{ item.status }})
        </div>
      </div>




    </div>
  </div>
</template>

<script setup lang="ts">
import { PhBell, PhChefHat, PhStar, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { CalendarDay } from '~/components/WeekCalendar.vue'
import type { CookInfo } from '~/components/HeroBlock.vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { request } = useDirectus()
const { user } = useAuth()



// test api
// const { request } = useDirectus()
interface TestItem {
  id: string
  dish_name: string
  status: string
  amount: number
}

const { data: items } = useAsyncData('test-api', () =>
    request<TestItem[]>('get', '/items/test_api')
)

// ---------------------

// ── Types ──
interface CookQueueItem {
  id: string
  date: string
  dish_name: string | null
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
  isToday: boolean
  isPast: boolean
}

interface HistoryItem {
  id: string
  dish_name: string
  cookName: string
  dateLabel: string
  rating: number
}

// ── State ──
const todayLoading = ref(true)
const weekLoading = ref(true)
const historyLoading = ref(true)

const todayCook = ref<{ cookName: string; dishName: string | null } | null>(null)
const participantCount = ref(0)
const totalCount = ref(0)
const allItems = ref<CookQueueItem[]>([])
const historyItems = ref<HistoryItem[]>([])
const searchQuery = ref('')

const isUserTodayCook = ref(false)
const hasJoined = ref(false)

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
    const item = allItems.value.find(
      (ci) => ci.date === iso && ci.status !== 'cancelled'
    )

    slots.push({
      date: iso,
      dayName: DAY_NAMES[i]!,
      dateStr: formatDateStr(d),
      cookName: item ? getCookName(item.cook) : null,
      dishName: item?.dish_name || null,
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
  }))
)

const selectedSlot = computed(() =>
  weekSlots.value.find((s) => s.date === selectedDate.value) ?? null
)

const heroCook = computed<CookInfo | null>(() => {
  if (!todayCook.value) return null
  return {
    name: todayCook.value.cookName,
    dish: todayCook.value.dishName || '',
  }
})

// ── Data fetching ──
const todayISO = formatDateISO(new Date())

onMounted(async () => {
  const params = new URLSearchParams({
    fields: '*,cook.id,cook.first_name,cook.last_name',
    sort: 'date',
  })

  let items: CookQueueItem[] = []
  try {
    // directus api — GET /items/cook_queue с полями cook.id, first_name, last_name
    // Запрашиваем всю очередь готовки, чтобы показать:
    //   - кто сегодня готовит (Today's block)
    //   - расписание на неделю (WeekCalendar)
    //   - историю блюд (Dish history)
    items = await request<CookQueueItem[]>('get', `/items/cook_queue?${params}`)
  } catch {
    // Directus may not be available
  }
  allItems.value = items

  // ── Today's block ──
  const todayItem = items.find(
    (i) => i.date === todayISO && i.status !== 'cancelled'
  )
  if (todayItem) {
    todayCook.value = {
      cookName: getCookName(todayItem.cook),
      dishName: todayItem.dish_name,
    }
    if (user.value && typeof todayItem.cook === 'object' && todayItem.cook !== null && todayItem.cook.id === user.value.id) {
      isUserTodayCook.value = true
    }
  }
  participantCount.value = 3
  totalCount.value = 8
  todayLoading.value = false

  // ── Week & History are derived from allItems — no loading needed ──
  weekLoading.value = false

  // ── Dish history ──
  const doneItems = items
    .filter((i) => i.date < todayISO && i.dish_name)
    .reverse()
    .slice(0, 20)

  historyItems.value = doneItems.map((i) => ({
    id: i.id,
    dish_name: i.dish_name || 'Unknown',
    cookName: getCookName(i.cook),
    dateLabel: formatDateStr(new Date(i.date)),
    rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
  }))
  historyLoading.value = false
})

const filteredHistory = computed(() => {
  if (!searchQuery.value) return historyItems.value
  const q = searchQuery.value.toLowerCase()
  return historyItems.value.filter((i) => i.dish_name.toLowerCase().includes(q))
})

// ── Actions ──
function onJoin() {
  if (hasJoined.value) return
  hasJoined.value = true
  participantCount.value = Math.min(participantCount.value + 1, totalCount.value)
}

function onBecomeCook() {
  router.push('/cook')
}

function onSignUp(date: string) {
  router.push('/cook')
}

function onViewDish(item: HistoryItem) {
  router.push('/recipe/today')
}
</script>
