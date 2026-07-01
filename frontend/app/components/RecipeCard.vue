<template>
  <div v-if="loading" class="bg-primary-light rounded-2xl overflow-hidden animate-pulse" :class="compact ? 'h-36' : 'h-44'">
    <div class="h-full bg-white/40" />
  </div>

  <div v-else-if="recipe" class="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" :style="{ backgroundColor: colors[(index ?? 0) % colors.length] }" @click="$emit('view')">

    <!-- Star decoration — darker shade of card color -->
    <svg
        class="absolute -right-1 -bottom-6 w-44 h-44 z-0 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        :fill="starColors[(index ?? 0) % starColors.length]"
    >
      <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
    </svg>

    <template v-if="compact">
      <img
          :src="cardImage.src"
          :alt="recipe.title"
          class="w-full h-24 object-cover"
      />
      <div class="px-2 pb-2 pt-1.5">
        <h3 class="text-[12px] font-semibold text-app-black leading-tight line-clamp-2 mb-0.5">
          {{ recipe.title }}
        </h3>
        <p class="text-[10px] text-gray-500 truncate">
          {{ recipe.chef }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="p-3 pb-[120px]">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-[14px] font-semibold text-app-black leading-tight line-clamp-2 mb-1">
              {{ recipe.title }}
            </h3>
            <p class="text-[11px] text-app-black/60 mb-2">
              by {{ recipe.chef }}
            </p>
          </div>
          <span v-if="likeCount !== undefined" class="flex items-center gap-1 text-[11px] text-gray-500 shrink-0 ml-2">
            <PhHeart :size="12" weight="fill" class="text-red-400" />
            {{ likeCount }}
          </span>
        </div>
      </div>

      <img
          :src="cardImage.src"
          :alt="recipe.title"
          class="absolute bottom-[-25px] left-[-12px] w-[160px] h-[140px] object-contain z-10"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhHeart } from '@phosphor-icons/vue'
import { useRecipeImage } from '~/composables/useRecipeImage'

const colors = ['#D2C5FF', '#FFF9B2', '#E1FFB0', '#FFD9B0']
const starColors = ['#B8A8F0', '#F0D800', '#B8E870', '#F0B870']

export interface Recipe {
  id: string
  title: string
  chef: string
  category: string
  photo?: string | null
}

const props = defineProps<{
  loading: boolean
  recipe: Recipe | undefined
  compact?: boolean
  likeCount?: number
  index?: number
}>()

const cardImage = useRecipeImage(computed(() => props.recipe ? { photo: props.recipe.photo, category: props.recipe.category } : null))

defineEmits<{
  view: []
}>()
</script>