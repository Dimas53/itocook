<template>
  <div v-if="loading" class="bg-primary-light rounded-2xl overflow-hidden animate-pulse" :class="compact ? 'h-36' : 'h-44'">
    <div class="h-full bg-white/40" />
  </div>

  <div v-else-if="recipe" class="bg-primary-light rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" @click="$emit('view')">
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
      <div class="p-3">
        <h3 class="text-[14px] font-semibold text-app-black leading-tight line-clamp-2 mb-1">
          {{ recipe.title }}
        </h3>
        <p class="text-[11px] text-app-black/60 mb-2">
          by {{ recipe.chef }}
        </p>
        <span v-if="likeCount !== undefined" class="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
          <PhHeart :size="12" weight="fill" class="text-red-400" />
          {{ likeCount }}
        </span>

        <div class="w-full rounded-b-2xl overflow-hidden bg-primary-light/30">
          <img
            :src="cardImage.src"
            :alt="recipe.title"
            class="w-full h-[140px] object-contain"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Recipe card with loading skeleton, compact/full variants, like count.
 * Touches `recipes` collection (via photo/category). Pure presentation.
 */
import { PhHeart } from '@phosphor-icons/vue'
import { useRecipeImage } from '~/composables/useRecipeImage'

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
}>()

const cardImage = useRecipeImage(computed(() => props.recipe ? { photo: props.recipe.photo, category: props.recipe.category } : null))

defineEmits<{
  view: []
}>()
</script>
