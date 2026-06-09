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
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'

export interface CalendarDay {
  date: string
  dayName: string
  dateNum: number
  hasActivity: boolean
  isToday: boolean
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
  if (day.date === props.selectedDate) {
    return 'bg-primary text-white'
  }
  if (day.isToday) {
    return 'bg-white text-app-black shadow-sm'
  }
  return 'bg-gray-100 text-app-black'
}

const monthLabel = computed(() => {
  if (!props.days.length) return ''
  const first = new Date(props.days[0]!.date + 'T12:00:00')
  const last = new Date(props.days[props.days.length - 1]!.date + 'T12:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  if (first.getMonth() === last.getMonth()) {
    return fmt(first)
  }
  return `${fmt(first)} - ${fmt(last)}`
})
</script>
