<script setup lang="ts">
import { PhBell, PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

interface CleaningEntry {
  id: string
  date: string
  department: string
  confirmed: boolean
  user: {
    id: string
    first_name: string
    last_name: string
  }
}

interface CalendarDay {
  dateNum: number
  iso: string
  isToday: boolean
  isPast: boolean
  entry: CleaningEntry | null
}

definePageMeta({ layout: 'app' })

const { request } = useDirectus()
const { user } = useAuth()

// ── Today block ──
const loading = ref(true)
const entry = ref<CleaningEntry | null>(null)
const todayISO = new Date().toISOString().split('T')[0]!

// ── Calendar ──
const monthOffset = ref(0)
const monthEntries = ref<CleaningEntry[]>([])
const calLoading = ref(false)
const selectedDay = ref<CalendarDay | null>(null)

const monthDate = computed(() => {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() + monthOffset.value)
  return d
})

const monthLabel = computed(() => {
  const d = monthDate.value
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
})

function monthStart(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function monthEnd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${y}-${m}-${String(last).padStart(2, '0')}`
}

function fmtISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isWeekday(dow: number): boolean {
  return dow >= 1 && dow <= 5
}

const entryMap = computed(() => {
  const map: Record<string, CleaningEntry> = {}
  for (const e of monthEntries.value) {
    map[e.date] = e
  }
  return map
})

const calendarRows = computed(() => {
  const d = monthDate.value
  const year = d.getFullYear()
  const month = d.getMonth()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const todayStr = fmtISO(new Date())

  const rows: CalendarDay[][] = []
  let row: CalendarDay[] = []

  // Find first weekday of the month
  let firstWeekdayDate = 1
  let firstWeekdayCol = 0
  for (let day = 1; day <= 7; day++) {
    const dateObj = new Date(year, month, day)
    const dow = dateObj.getDay()
    if (isWeekday(dow)) {
      firstWeekdayDate = day
      // dow: 1=Mon→0, 2=Tue→1, 3=Wed→2, 4=Thu→3, 5=Fri→4
      firstWeekdayCol = dow - 1
      break
    }
  }

  // Leading blanks
  for (let i = 0; i < firstWeekdayCol; i++) {
    row.push({ dateNum: 0, iso: '', isToday: false, isPast: false, entry: null })
  }

  for (let day = firstWeekdayDate; day <= lastDate; day++) {
    const dateObj = new Date(year, month, day)
    const dow = dateObj.getDay()
    if (!isWeekday(dow)) continue

    const iso = fmtISO(dateObj)
    const calEntry = entryMap.value[iso] ?? null
    row.push({
      dateNum: day,
      iso,
      isToday: iso === todayStr,
      isPast: iso < todayStr,
      entry: calEntry,
    })

    if (row.length === 5) {
      rows.push(row)
      row = []
    }
  }

  // Trailing blanks
  while (row.length < 5) {
    row.push({ dateNum: 0, iso: '', isToday: false, isPast: false, entry: null })
  }
  if (row.length > 0) {
    rows.push(row)
  }

  return rows
})

function cellClasses(day: CalendarDay): string {
  if (!day.iso) return ''
  if (day.isToday) return 'bg-primary text-white'
  if (day.entry && day.entry.user.id === user.value?.id) return 'bg-primary-pale text-primary font-semibold'
  if (day.entry) return 'bg-white border border-gray-100 text-app-black'
  if (day.isPast) return 'text-gray-300'
  return 'bg-white border border-gray-100 text-app-black'
}

function isClickable(day: CalendarDay): boolean {
  return !!day.iso && !!day.entry
}

function onCellTap(day: CalendarDay) {
  if (!isClickable(day)) return
  if (selectedDay.value?.iso === day.iso) {
    selectedDay.value = null
  } else {
    selectedDay.value = day
  }
}

function shiftMonth(delta: number) {
  monthOffset.value += delta
  selectedDay.value = null
}

async function fetchMonth() {
  calLoading.value = true
  try {
    const items = await request<CleaningEntry[]>('get',
      `/items/cleaning_schedule?filter[date][_gte]=${monthStart(monthDate.value)}&filter[date][_lte]=${monthEnd(monthDate.value)}&fields=id,date,department,confirmed,user.id,user.first_name,user.last_name&limit=100`
    )
    monthEntries.value = items ?? []
  } catch {
    monthEntries.value = []
  }
  calLoading.value = false
}

watch(monthDate, fetchMonth)

// ── Today block logic ──
async function confirmDuty() {
  if (!entry.value) return
  await fetch('/api/duty/confirm', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: entry.value.id, confirmed: true }),
  })
  entry.value.confirmed = true
  const calEntry = monthEntries.value.find(e => e.id === entry.value!.id)
  if (calEntry) calEntry.confirmed = true
}

const isCurrentUser = computed(() => {
  if (!entry.value || !user.value) return false
  return entry.value.user.id === user.value.id
})

const fullName = computed(() => {
  if (!entry.value) return ''
  const u = entry.value.user
  return [u.first_name, u.last_name].filter(Boolean).join(' ')
})

const selectedEntryName = computed(() => {
  if (!selectedDay.value?.entry) return ''
  const u = selectedDay.value.entry.user
  return [u.first_name, u.last_name].filter(Boolean).join(' ')
})

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

onMounted(async () => {
  try {
    const items = await request<CleaningEntry[]>('get',
      `/items/cleaning_schedule?filter[date][_eq]=${todayISO}&fields=id,date,department,confirmed,user.id,user.first_name,user.last_name&limit=1`
    )
    entry.value = items?.[0] ?? null
  } catch {
    entry.value = null
  }
  loading.value = false
  await fetchMonth()
})
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Cleaning</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">Duty Roster</h1>
      </div>
      <button class="w-10 h-10 flex items-center justify-center">
        <PhBell class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-[100px] space-y-5">
      <!-- Today block -->
      <div class="bg-white rounded-2xl px-4 py-4 shadow-sm">
        <div v-if="loading" class="space-y-3">
          <div class="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
          <div class="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
          <div class="h-6 w-36 bg-gray-100 rounded-full animate-pulse mt-1" />
        </div>

        <template v-else-if="entry">
          <p class="text-[11px] text-gray-400 uppercase tracking-wide">On duty today</p>
          <span class="inline-block bg-primary-pale text-primary text-[12px] font-medium rounded-full px-3 py-1 mt-2">
            {{ entry.department }}
          </span>
          <p class="text-[20px] font-semibold text-app-black mt-1">{{ fullName }}</p>

          <button
            v-if="isCurrentUser && !entry.confirmed"
            class="bg-primary text-white h-10 rounded-xl w-full mt-3 text-[14px] font-semibold active:scale-[0.98] transition-transform"
            @click="confirmDuty"
          >
            ✓ Confirm Duty
          </button>

          <div v-else-if="isCurrentUser && entry.confirmed" class="mt-3">
            <span class="inline-block bg-green-pastel text-green-700 text-[14px] font-semibold rounded-xl px-4 py-2 w-full text-center">
              ✓ Confirmed
            </span>
          </div>
        </template>

        <p v-else class="text-[14px] text-gray-400">No duty assigned for today</p>
      </div>

      <!-- Monthly calendar -->
      <div>
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[16px] font-semibold text-app-black">{{ monthLabel }}</h2>
          <div class="flex items-center gap-2">
            <button
              class="w-7 h-7 flex items-center justify-center active:scale-[0.95] transition-transform"
              @click="shiftMonth(-1)"
            >
              <PhCaretLeft class="w-5 h-5 text-gray-400" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center active:scale-[0.95] transition-transform"
              @click="shiftMonth(1)"
            >
              <PhCaretRight class="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <!-- Weekday labels -->
        <div class="grid grid-cols-5 gap-2 mb-2">
          <div
            v-for="label in WEEKDAY_LABELS"
            :key="label"
            class="text-center text-[11px] text-gray-400 font-medium"
          >
            {{ label }}
          </div>
        </div>

        <!-- Grid -->
        <div v-if="calLoading" class="flex items-center justify-center py-8">
          <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else class="space-y-2">
          <div v-for="(row, ri) in calendarRows" :key="ri" class="grid grid-cols-5 gap-2">
            <div
              v-for="(day, ci) in row"
              :key="ri + '-' + ci"
              class="relative rounded-xl text-center py-2 cursor-pointer active:scale-[0.97] transition-transform"
              :class="cellClasses(day)"
              @click="onCellTap(day)"
            >
              <template v-if="day.iso">
                <span class="text-[14px] font-medium" :class="day.isToday ? 'text-white' : ''">{{ day.dateNum }}</span>
                <div
                  v-if="day.entry"
                  class="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                  :class="day.entry.confirmed ? 'bg-green-400' : 'bg-primary-light'"
                />
              </template>
            </div>
          </div>
        </div>

        <!-- Popover -->
        <div
          v-if="selectedDay?.entry"
          class="mt-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[14px] font-semibold text-app-black">{{ selectedEntryName }}</p>
              <p class="text-[12px] text-gray-500 mt-0.5">{{ selectedDay.entry.department }}</p>
            </div>
            <span
              v-if="selectedDay.isPast"
              class="inline-block bg-gray-100 text-gray-400 text-[11px] font-medium rounded-full px-2.5 py-1"
            >
              Done
            </span>
            <span
              v-else-if="selectedDay.entry.confirmed"
              class="inline-block bg-green-pastel text-green-700 text-[11px] font-semibold rounded-full px-2.5 py-1"
            >
              ✓ Confirmed
            </span>
            <span
              v-else
              class="inline-block bg-gray-100 text-gray-400 text-[11px] font-medium rounded-full px-2.5 py-1"
            >
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
