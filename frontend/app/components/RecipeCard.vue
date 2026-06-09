<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="bg-primary-light rounded-2xl overflow-hidden h-32 animate-pulse">
    <div class="h-full bg-white/40" />
  </div>

  <!-- Data -->
  <div v-else class="bg-primary-light rounded-2xl overflow-hidden relative h-32">
    <div class="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-white/50" />

    <div class="relative z-10 p-4 h-full flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div class="flex-1 mr-20">
          <h3 class="text-[16px] font-semibold text-app-black leading-tight line-clamp-2">
            {{ recipe.title }}
          </h3>
          <p class="text-[12px] text-app-black/60 mt-1">
            by {{ recipe.chef }}
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <PhStar class="w-4 h-4 text-secondary" weight="fill" />
          <span class="text-[12px] font-medium text-app-black">{{ recipe.rating }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="bg-app-black text-white text-[12px] rounded-full px-3 py-1 font-medium">
          {{ recipe.time }}
        </span>
        <button
          class="bg-white rounded-full px-4 py-1.5 text-[13px] font-medium text-app-black active:scale-[0.98] transition-transform"
          @click="$emit('view')"
        >
          See Recipe
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue'

export interface Recipe {
  title: string
  chef: string
  rating: number
  time: string
}

defineProps<{
  loading: boolean
  recipe?: Recipe
}>()

defineEmits<{
  view: []
}>()
</script>
