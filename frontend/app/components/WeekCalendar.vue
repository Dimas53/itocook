<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-[16px] font-semibold text-app-black">{{ monthLabel }}</h2>
      <div class="flex items-center gap-1">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full active:scale-[0.95] transition-transform text-app-black/60 hover:text-app-black"
          @click="$emit('prev-week')"
        >
          <PhCaretLeft class="w-5 h-5" weight="bold" />
        </button>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full active:scale-[0.95] transition-transform text-app-black/60 hover:text-app-black"
          @click="$emit('next-week')"
        >
          <PhCaretRight class="w-5 h-5" weight="bold" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1.5">
      <button
        v-for="day in days"
        :key="day.date"
        class="flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-colors active:scale-[0.97]"
        :class="getDayClasses(day)"
        @click="$emit('select-day', day.date)"
      >
        <span class="text-xs font-semibold">{{ day.dayName }}</span>
        <span class="text-lg font-bold">{{ day.dateNum }}</span>
        <span v-if="day.hasActivity" class="w-1.5 h-1.5 rounded-full bg-purple-500 mt-0.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Week-based calendar navigation with activity dots per day.
 * Pure UI — no collections, receives day data via props.
 */
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

export interface CalendarDay {
  date: string
  dayName: string
  dateNum: number
  hasActivity: boolean
  isToday: boolean
  isPast: boolean
}

const props = defineProps<{
  days: CalendarDay[]
  selectedDate: string
}>()

defineEmits<{
  'select-day': [date: string]
  'prev-week': []
  'next-week': []
}>()

function getDayClasses(day: CalendarDay) {
  if (day.isPast) {
    return 'bg-gray-100 text-gray-400 opacity-40 pointer-events-none cursor-default'
  }
  if (day.date === props.selectedDate) {
    return 'bg-primary text-white'
  }
  if (day.isToday) {
    return 'bg-purple-100 text-purple-700'
  }
  return 'bg-gray-100 text-app-black'
}

const monthLabel = computed(() => {
  if (!props.days.length) return ''
  const first = parseISODate(props.days[0]!.date)
  const last = parseISODate(props.days[props.days.length - 1]!.date)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  if (first.getMonth() === last.getMonth()) {
    return fmt(first)
  }
  return `${fmt(first)} - ${fmt(last)}`
})
</script>
