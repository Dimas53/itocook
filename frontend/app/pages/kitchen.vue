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

      <!-- 1. Today's block -->
      <div class="rounded-2xl bg-primary-light p-5">
        <div v-if="todayLoading" class="space-y-3">
          <div class="h-3 w-24 bg-white/60 rounded-full animate-pulse" />
          <div class="h-5 w-40 bg-white/60 rounded-full animate-pulse" />
          <div class="h-8 w-full bg-white/60 rounded-2xl animate-pulse" />
        </div>

        <div v-else class="space-y-4">
          <p class="text-[12px] text-app-black/60 font-semibold uppercase tracking-wide">Today's Kitchen</p>

          <div v-if="todayCook">
            <p class="text-[14px] text-app-black/70">Cooked by</p>
            <p class="text-[20px] font-bold text-app-black">{{ todayCook.cookName }}</p>
            <p v-if="todayCook.dishName" class="text-[14px] text-app-black/70 mt-1">
              Dish: <span class="font-semibold text-app-black">{{ todayCook.dishName }}</span>
            </p>
            <div class="flex items-center gap-1.5 mt-2">
              <PhUsers class="w-3.5 h-3.5 text-app-black/50" weight="fill" />
              <p class="text-[12px] text-app-black/50">
                <span class="font-semibold text-app-black">{{ participantCount }}</span> of {{ totalCount }} confirmed
              </p>
            </div>
            <div v-if="isUserTodayCook" class="mt-3 inline-flex items-center gap-1.5 bg-primary text-white text-[12px] font-semibold rounded-full px-4 py-1.5">
              <PhChefHat class="w-4 h-4" weight="fill" />
              You're cooking today
            </div>
          </div>

          <div v-else class="space-y-3">
            <p class="text-[14px] text-app-black/70">No cook assigned for today</p>
            <button
              class="w-full h-10 rounded-full bg-primary text-white font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              @click="onBecomeCook"
            >
              <PhChefHat class="w-4 h-4" weight="fill" />
              Become a cook
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Weekly cook queue -->
      <div>
        <h2 class="text-[16px] font-semibold text-app-black mb-3">This Week</h2>

        <div v-if="weekLoading" class="space-y-2">
          <div v-for="i in 7" :key="i" class="h-12 bg-gray-100 rounded-xl animate-pulse" />
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="slot in weekSlots"
            :key="slot.date"
            class="rounded-xl flex items-center justify-between px-4 py-3"
            :class="slot.isToday ? 'bg-primary text-white' : 'bg-primary-light/50'"
          >
            <div class="flex items-center gap-3">
              <div>
                <p class="text-[13px] font-semibold" :class="slot.isToday ? 'text-white' : 'text-app-black'">
                  {{ slot.dayName }}
                </p>
                <p class="text-[11px]" :class="slot.isToday ? 'text-white/70' : 'text-app-black/50'">
                  {{ slot.dateStr }}
                </p>
              </div>
              <p class="text-[14px]" :class="slot.isToday ? 'text-white/90' : 'text-app-black/70'">
                {{ slot.cookName || 'Free' }}
                <span v-if="slot.dishName" class="text-[12px] opacity-70"> — {{ slot.dishName }}</span>
              </p>
            </div>

            <button
              v-if="!slot.cookName && !slot.isPast"
              class="shrink-0 h-8 rounded-full px-4 text-[12px] font-semibold active:scale-[0.98] transition-transform"
              :class="slot.isToday ? 'bg-white text-primary' : 'bg-primary text-white'"
              @click="onSignUp(slot.date)"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Dish history -->
      <div>
        <h2 class="text-[16px] font-semibold text-app-black mb-3">Dish History</h2>

        <!-- Search -->
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { PhBell, PhChefHat, PhUsers, PhStar, PhMagnifyingGlass } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { request } = useDirectus()
const { user } = useAuth()

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
const weekSlots = ref<WeekSlot[]>([])
const historyItems = ref<HistoryItem[]>([])
const searchQuery = ref('')

const isUserTodayCook = ref(false)

// ── Helpers ──
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
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
  return d.toISOString().split('T')[0]!
}

function getCookName(cook: CookQueueItem['cook']): string {
  if (!cook) return ''
  if (typeof cook === 'object') {
    return [cook.first_name, cook.last_name].filter(Boolean).join(' ') || 'Unknown'
  }
  return 'Unknown'
}

// ── Data fetching ──
const todayISO = formatDateISO(new Date())

onMounted(async () => {
  // Fetch all cook_queue items
  const params = new URLSearchParams({
    fields: '*,cook.id,cook.first_name,cook.last_name',
    sort: 'date',
  })

  let allItems: CookQueueItem[] = []
  try {
    allItems = await request<CookQueueItem[]>('get', `/items/cook_queue?${params}`)
  } catch {
    // Directus may not be available — use defaults
  }

  // ── Today's block ──
  const todayItem = allItems.find(
    (i) => i.date === todayISO && i.status !== 'cancelled'
  )
  if (todayItem) {
    todayCook.value = {
      cookName: getCookName(todayItem.cook),
      dishName: todayItem.dish_name,
    }
    if (user.value && typeof todayItem.cook === 'object' && todayItem.cook.id === user.value.id) {
      isUserTodayCook.value = true
    }
  }
  participantCount.value = 3 // mock
  totalCount.value = 8 // mock
  todayLoading.value = false

  // ── Weekly queue ──
  const monday = getMonday(new Date())
  const slots: WeekSlot[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = formatDateISO(d)
    const item = allItems.find(
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
  weekSlots.value = slots
  weekLoading.value = false

  // ── Dish history ──
  const doneItems = allItems
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
function onBecomeCook() {
  router.push('/cook')
}

function onSignUp(date: string) {
  // Creates a cook_queue entry — Phase 5 real implementation
  router.push('/cook')
}

function onViewDish(item: HistoryItem) {
  router.push('/recipe/today')
}
</script>
