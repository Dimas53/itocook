<script setup lang="ts">
/**
 * Full month calendar grid (Mon-Fri) with entry dots, selection, navigation.
 * UI component — receives `currentMonth` and `entries` via props.
 */
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

export interface CalendarEntry {
  date: string
  dotColor?: string
  cellClass?: string
}

interface CalendarCell {
  dateNum: number
  iso: string
  isToday: boolean
  isPast: boolean
  entry: CalendarEntry | null
}

const props = withDefaults(defineProps<{
  currentMonth: Date
  entries?: CalendarEntry[]
  selectedDate?: string | null
}>(), {
  entries: () => [],
  selectedDate: null,
})

const emit = defineEmits<{
  select: [date: string]
  'prev-month': []
  'next-month': []
}>()

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const monthLabel = computed(() => {
  const d = props.currentMonth
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
})

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
  const map: Record<string, CalendarEntry> = {}
  for (const e of props.entries) {
    map[e.date] = e
  }
  return map
})

const calendarRows = computed(() => {
  const d = props.currentMonth
  const year = d.getFullYear()
  const month = d.getMonth()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const todayStr = fmtISO(new Date())

  const rows: CalendarCell[][] = []
  let row: CalendarCell[] = []

  let firstWeekdayDate = 1
  let firstWeekdayCol = 0
  for (let day = 1; day <= 7; day++) {
    const dateObj = new Date(year, month, day)
    const dow = dateObj.getDay()
    if (isWeekday(dow)) {
      firstWeekdayDate = day
      firstWeekdayCol = dow - 1
      break
    }
  }

  for (let i = 0; i < firstWeekdayCol; i++) {
    row.push({ dateNum: 0, iso: '', isToday: false, isPast: false, entry: null })
  }

  for (let day = firstWeekdayDate; day <= lastDate; day++) {
    const dateObj = new Date(year, month, day)
    const dow = dateObj.getDay()
    if (!isWeekday(dow)) continue

    const iso = fmtISO(dateObj)
    row.push({
      dateNum: day,
      iso,
      isToday: iso === todayStr,
      isPast: iso < todayStr,
      entry: entryMap.value[iso] ?? null,
    })

    if (row.length === 5) {
      rows.push(row)
      row = []
    }
  }

  while (row.length < 5) {
    row.push({ dateNum: 0, iso: '', isToday: false, isPast: false, entry: null })
  }
  if (row.length > 0) {
    rows.push(row)
  }

  return rows
})

function cellClasses(cell: CalendarCell): string {
  if (!cell.iso) return ''
  if (cell.isToday) return 'bg-primary text-white'
  if (cell.iso === props.selectedDate) return 'ring-2 ring-primary bg-white'
  if (cell.entry?.cellClass) return cell.entry.cellClass
  return 'bg-white border border-gray-100 text-app-black'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[16px] font-semibold text-app-black">{{ monthLabel }}</h2>
      <div class="flex items-center gap-2">
        <button
          class="w-7 h-7 flex items-center justify-center active:scale-[0.95] transition-transform"
          @click="$emit('prev-month')"
        >
          <PhCaretLeft class="w-5 h-5 text-gray-400" />
        </button>
        <button
          class="w-7 h-7 flex items-center justify-center active:scale-[0.95] transition-transform"
          @click="$emit('next-month')"
        >
          <PhCaretRight class="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-2 mb-2">
      <div
        v-for="label in WEEKDAY_LABELS"
        :key="label"
        class="text-center text-[11px] text-gray-400 font-medium"
      >
        {{ label }}
      </div>
    </div>

    <div class="space-y-2">
      <div v-for="(row, ri) in calendarRows" :key="ri" class="grid grid-cols-5 gap-2">
        <div
          v-for="(cell, ci) in row"
          :key="ri + '-' + ci"
          class="relative rounded-xl text-center py-2 cursor-pointer active:scale-[0.97] transition-transform"
          :class="cellClasses(cell)"
          @click="cell.iso ? $emit('select', cell.iso) : null"
        >
          <template v-if="cell.iso">
            <span class="text-[14px] font-medium" :class="cell.isToday ? 'text-white' : ''">{{ cell.dateNum }}</span>
            <div
              v-if="cell.entry?.dotColor"
              class="w-1.5 h-1.5 rounded-full mx-auto mt-1"
              :style="{ backgroundColor: cell.entry.dotColor }"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
