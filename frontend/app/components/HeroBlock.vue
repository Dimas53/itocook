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



      <!-- Buttons row -->
      <div class="flex gap-3">
        <button
            v-if="cook && joined"
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.97] backdrop-blur-md bg-primary/10 border border-primary/30 shadow-sm z-10"
            @click="$emit('go-to-cook')"
        >
          <PhChefHat class="size-4 text-app-black" weight="fill" />
          <span class="font-semibold text-[14px] text-app-black">Cook →</span>
        </button>
        <button
            v-else
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.97] backdrop-blur-md bg-white/30 border border-white/50 shadow-sm z-10"
            :class="cook ? 'opacity-40 pointer-events-none' : ''"
            @click="$emit('become-cook')"
        >
          <PhChefHat class="size-4 text-app-black" weight="fill" />
          <span class="font-semibold text-[14px] text-app-black">Cook</span>
        </button>

        <button
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all active:scale-[0.97] backdrop-blur-md bg-white/30 border border-white/50 shadow-sm z-10"
            :class="joined ? 'opacity-60' : ''"
            @click="$emit('join')"
        >
          <PhForkKnife class="size-4 text-app-black" weight="fill" />
          <span class="font-semibold text-[14px] text-app-black">
      {{ joined ? 'Joined ✓' : 'Join' }}
    </span>
        </button>
      </div>

      <!-- Dish block -- only when cook is set -->

      <div v-if="cook" class="relative mt-3 -mx-5 -mb-5 min-h-[140px] cursor-pointer" @click="onDishClick">
        <!-- Text left -->
        <div class="absolute left-5 bottom-5 flex flex-col gap-1 z-10">
          <span class="text-[22px] font-bold text-app-black">
            {{ cook.dish || 'Chef is thinking...' }}
          </span>
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

        <!-- Star decoration -->
        <svg
            class="absolute -right-1 -bottom-8 w-56 h-56 z-0 opacity-10 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
        >
          <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
        </svg>

        <!-- Dish image overlay -->
        <img
            :src="dishImage"
            alt="Dish"
            :class="[
              'absolute -right-10 -bottom-12 rounded-full shadow-sm z-10 transition-all',
              isNoRecipe
                ? 'w-48 h-48 object-scale-down -right-6 -bottom-8'
                : 'w-56 h-44 object-cover'
            ]"
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
  photo?: string | null
  category?: string | null
}

const props = defineProps<{
  loading: boolean
  cook: CookInfo | null
  joined?: boolean
  participantCount?: number
  totalCount?: number
  recipeId?: string
}>()

const emit = defineEmits<{
  join: []
  'become-cook': []
  'view-dish': []
  'go-to-cook': []
}>()

const router = useRouter()

const CHEF_COOK = '/images/onboarding/chef-cook.png'

const isNoRecipe = computed(() => props.cook && !props.cook.photo && !props.cook.category)

const dishImage = computed(() => {
  if (!props.cook) return '/images/categories/other.png'
  if (isNoRecipe.value) return CHEF_COOK
  return useRecipeImage({
    photo: props.cook.photo ?? null,
    category: props.cook.category ?? 'other'
  }).value
})

function onDishClick() {
  if (props.recipeId) {
    router.push(`/recipe/${props.recipeId}`)
  } else {
    emit('view-dish')
  }
  }
</script>