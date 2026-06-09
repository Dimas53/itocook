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

    <div class="flex gap-1.5">
      <button
        v-for="day in days"
        :key="day.date"
        class="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-colors active:scale-[0.97]"
        :class="getDayClasses(day)"
        @click="$emit('select-day', day.date)"
      >
        <span class="text-[11px] font-semibold uppercase tracking-wide">{{ day.dayName }}</span>
        <span class="text-[18px] font-bold leading-none">{{ day.dateNum }}</span>
        <span v-if="day.hasActivity" class="w-1 h-1 rounded-full mt-0.5" :class="day.date === selectedDate ? 'bg-white' : 'bg-primary'" />
        <span v-else class="w-1 h-1 mt-0.5" />
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
    return 'bg-primary text-white shadow-none'
  }
  if (day.isToday) {
    return 'bg-white text-app-black shadow-sm'
  }
  return 'bg-gray-100/70 text-app-black'
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
