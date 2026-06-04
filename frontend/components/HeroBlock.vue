<template>
  <div class="bg-primary-light rounded-2xl p-5 relative overflow-hidden">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div class="h-4 w-24 bg-white/60 rounded-full animate-pulse" />
      <div class="h-6 w-40 bg-white/60 rounded-full animate-pulse" />
      <div class="h-4 w-32 bg-white/60 rounded-full animate-pulse" />
    </div>

    <!-- Cook assigned -->
    <div v-else-if="cook" class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Today's Cook</p>
        <p class="text-[20px] font-semibold text-app-black mt-1">{{ cook.name }}</p>
        <p v-if="cook.dish" class="text-[14px] text-app-black/80 mt-0.5">{{ cook.dish }}</p>
        <div v-if="cook.status" class="mt-3">
          <span
            class="inline-block text-[12px] font-medium px-3 py-1 rounded-full"
            :class="statusClass"
          >
            {{ cook.status }}
          </span>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            class="h-10 px-5 rounded-2xl bg-app-black text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="$emit('join')"
          >
            I'm having lunch
          </button>
          <button
            class="h-10 px-5 rounded-2xl border border-gray-200 bg-white text-app-black font-medium text-[14px] active:scale-[0.98] transition-transform"
            @click="$emit('decline')"
          >
            Skip
          </button>
        </div>
      </div>
      <div class="w-16 h-16 rounded-full bg-white/60 shrink-0 flex items-center justify-center">
        <PhCookingPot class="w-7 h-7 text-primary" weight="fill" />
      </div>
    </div>

    <!-- Empty / no cook -->
    <div v-else class="flex items-start justify-between">
      <div>
        <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Who's Cooking?</p>
        <p class="text-[14px] text-app-black/60 mt-1">No cook assigned for today</p>
        <button
          class="mt-4 h-10 px-5 rounded-2xl bg-app-black text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
          @click="$emit('become-cook')"
        >
          I'm cooking today
        </button>
      </div>
      <div class="w-16 h-16 rounded-full bg-white/60 shrink-0 flex items-center justify-center">
        <PhChefHat class="w-7 h-7 text-primary" weight="fill" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCookingPot, PhChefHat } from '@phosphor-icons/vue'

interface CookInfo {
  name: string
  dish?: string
  status?: string
}

defineProps<{
  loading: boolean
  cook: CookInfo | null
}>()

defineEmits<{
  join: []
  decline: []
  'become-cook': []
}>()

const statusClass = computed(() => {
  return 'bg-white text-app-black'
})
</script>
