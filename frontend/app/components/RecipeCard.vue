<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="bg-primary-light rounded-2xl overflow-hidden h-44 animate-pulse">
    <div class="h-full bg-white/40" />
  </div>

  <!-- Data -->
  <div v-else-if="recipe" class="bg-primary-light rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform" @click="$emit('view')">
    <div class="p-3">
      <h3 class="text-[14px] font-semibold text-app-black leading-tight line-clamp-2 mb-1">
        {{ recipe.title }}
      </h3>
      <p class="text-[11px] text-app-black/60 mb-2">
        by {{ recipe.chef }}
      </p>
      <div class="flex items-center gap-1 mb-2">
        <PhStar class="w-3 h-3 text-secondary" weight="fill" />
        <span class="text-[11px] font-medium text-app-black">{{ recipe.rating }}</span>
      </div>
      <img
        :src="cardImage"
        :alt="recipe.title"
        class="w-full h-24 rounded-xl object-cover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue'
import { useRecipeImage } from '~/composables/useRecipeImage'

export interface Recipe {
  id: string
  title: string
  chef: string
  rating: number
  category: string
  photo?: string | null
}

const props = defineProps<{
  loading: boolean
  recipe: Recipe | undefined
}>()

const cardImage = useRecipeImage(computed(() => props.recipe ? { photo: props.recipe.photo, category: props.recipe.category } : null))

defineEmits<{
  view: []
}>()
</script>
