<script setup lang="ts">
import { PhHeart } from '@phosphor-icons/vue'
import { useRecipeImage } from '~/composables/useRecipeImage'

const props = defineProps<{
  recipe: {
    id: string
    dish_name: string
    chef: string
    category: string | null
    photo: string | null
    likeCount?: number
  }
}>()

const image = useRecipeImage(computed(() => props.recipe))
</script>

<template>
  <div class="bg-primary-light rounded-2xl overflow-hidden flex flex-col active:scale-[0.98] transition-transform cursor-pointer">
    <div class="h-[90px] overflow-hidden bg-primary-pale">
      <img :src="image.src" :alt="recipe.dish_name" class="w-full h-full object-cover" />
    </div>
    <div class="p-2 flex justify-between  items-start gap-0.5">
      <div class="flex flex-col flex-1">
        <p class="text-[10px] text-gray-500 truncate mt-auto">{{ recipe.chef }}</p>
        <p class="text-[11px] font-semibold text-app-black leading-tight line-clamp-2">{{ recipe.dish_name }}</p>
      </div>

      <span v-if="recipe.likeCount !== undefined" class="flex items-center gap-0.5 text-[9px] text-gray-400">
        <PhHeart :size="9" weight="fill" class="text-red-300" />
        {{ recipe.likeCount }}
      </span>
    </div>
  </div>
</template>
