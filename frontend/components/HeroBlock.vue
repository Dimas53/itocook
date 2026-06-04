<template>
  <div class="rounded-2xl overflow-hidden relative">
    <div class="bg-primary-light rounded-2xl p-5 relative">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div class="h-3 w-32 bg-white/60 rounded-full animate-pulse" />
      <div class="h-10 bg-white/60 rounded-full animate-pulse" />
      <div class="h-24 bg-white/60 rounded-2xl animate-pulse" />
    </div>

    <div v-else class="space-y-4">
      <!-- Title -->
      <p class="text-[12px] text-app-black/60 font-semibold uppercase tracking-wide">
        Today's Kitchen
      </p>



      <!-- Кнопки рядом -->
      <div class="flex gap-3">
        <button
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.97] backdrop-blur-md bg-white/30 border border-white/50 shadow-sm"
            :class="cook ? 'opacity-40 pointer-events-none' : ''"
            @click="$emit('become-cook')"
        >
          <PhChefHat class="size-4 text-app-black" weight="fill" />
          <span class="font-semibold text-[14px] text-app-black">Cook</span>
        </button>

        <button
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.97] backdrop-blur-md bg-white/30 border border-white/50 shadow-sm"
            :class="joined ? 'opacity-60' : ''"
            @click="$emit('join')"
        >
          <PhForkKnife class="size-4 text-app-black" weight="fill" />
          <span class="font-semibold text-[14px] text-app-black">
      {{ joined ? 'Joined ✓' : 'Join' }}
    </span>
        </button>
      </div>

      <!-- Блок блюда — только если повар назначен -->

      <div v-if="cook" class="relative mt-3 -mx-5 -mb-5 min-h-[140px]">
        <!-- Текст слева -->
        <div class="absolute left-5 bottom-5 flex flex-col gap-1 z-10">
          <h3 class="text-[22px] font-bold text-app-black leading-tight">
            {{ cook.dish }}
          </h3>
          <p class="text-[13px] text-app-black/60">by {{ cook.name }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <PhUsers class="w-3.5 h-3.5 text-app-black/50" weight="fill" />
            <p class="text-[12px] text-app-black/50">
              <span class="font-semibold text-app-black">{{ participantCount }}</span>
              {{ ' of ' }}
              <span class="font-semibold text-app-black">{{ totalCount }}</span>
              {{ ' confirmed' }}
            </p>
          </div>
        </div>

        <!-- Звёздочка-подложка -->
        <svg
            class="absolute -right-1 -bottom-8 w-56 h-56 z-0 opacity-10 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
        >
          <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
        </svg>

        <!-- Картинка блюда поверх -->
        <img
            :src="cook.photo || '/images/salat.png'"
            alt="Dish"
            class="absolute -right-10 -bottom-12 w-44 h-44 object-cover rounded-full shadow-lg z-10"
        />


      </div>

    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { PhChefHat, PhForkKnife, PhUsers } from '@phosphor-icons/vue'

export interface CookInfo {
  name: string
  dish: string
  photo?: string
}

defineProps<{
  loading: boolean
  cook: CookInfo | null
  joined?: boolean
  participantCount?: number
  totalCount?: number
}>()

defineEmits<{
  join: []
  'become-cook': []
}>()
</script>