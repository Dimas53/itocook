<template>
  <div class="rounded-2xl overflow-hidden relative">
    <div class="bg-primary-light rounded-2xl p-5 relative">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div class="h-3 w-32 bg-white/60 rounded-full animate-pulse" />
      <div class="h-10 bg-white/60 rounded-full animate-pulse" />
      <div class="h-24 bg-white/60 rounded-2xl animate-pulse" />
    </div>

    <!-- Empty state: no cook assigned -->
    <div v-else-if="!cook" class="space-y-4">
      <p class="text-[12px] text-app-black/60 font-semibold uppercase tracking-wide">
        Today's Kitchen
      </p>
      <div class="flex flex-col items-center gap-4 py-4">
        <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <PhChefHat class="w-7 h-7 text-primary" weight="fill" />
        </div>
        <div class="text-center">
          <p class="text-[16px] font-bold text-app-black">No one's cooking yet</p>
          <p class="text-[13px] text-app-black/60 mt-1">Be today's chef!</p>
        </div>
        <button
          :disabled="hasExistingQueue"
          class="h-11 px-8 rounded-full bg-primary text-white font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          :class="hasExistingQueue ? '' : 'active:scale-[0.98]'"
          @click="$emit('become-cook')"
        >
          <PhChefHat class="w-4 h-4" weight="fill" />
          I'm cooking today!
        </button>
      </div>
    </div>

    <!-- Normal content: cook assigned -->
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
            :disabled="!!cook || hasExistingQueue"
            class="flex-1 h-10 rounded-full flex items-center justify-center gap-2 px-4 transition-all backdrop-blur-md bg-white/30 border border-white/50 shadow-sm z-10"
            :class="(cook || hasExistingQueue) ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'"
            @click="onBecomeCook"
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

      <div class="relative mt-3 -mx-5 -mb-5 min-h-[140px] cursor-pointer" @click="onDishClick">
        <!-- Text left -->
        <div class="absolute left-5 -bottom-4 flex flex-col gap-1 z-10">
          <span class="text-[22px] font-bold text-app-black">
            {{ cook.dish || 'Chef is thinking...' }}
          </span>
          <span v-if="cook.category" class="text-[12px] text-app-black/60 uppercase mb-5 tracking-wide font-medium">
            {{ cook.category }}
          </span>
          <p class="text-[15px] font-medium text-app-black/80">by {{ cook.name }}</p>
          <div
            class="flex items-center gap-1.5 mt-0.5 min-h-[44px] cursor-pointer relative z-10 active:opacity-70 transition-opacity"
            @click.stop="$emit('show-participants')"
          >
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
            :src="dishImage.src"
            alt="Dish"
            :class="[
              'absolute z-10 transition-all shadow-sm',
              isNoRecipe
                ? 'w-48 h-48 object-scale-down -right-6 -bottom-8 rounded-full'
                : dishImage.isUploaded
                  ? 'w-48 h-48 object-cover rounded-full border-[3px] border-white -right-7 -bottom-14'
                  : 'w-56 h-44 object-cover rounded-full -right-10 -bottom-12'
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
  queueId?: string
}

const props = defineProps<{
  loading: boolean
  cook: CookInfo | null
  joined?: boolean
  participantCount?: number
  totalCount?: number
  recipeId?: string
  hasExistingQueue?: boolean
}>()

const emit = defineEmits<{
  join: []
  'become-cook': []
  'view-dish': []
  'go-to-cook': []
  'show-participants': []
}>()

const router = useRouter()

const CHEF_COOK = '/images/onboarding/chef-cook.png'

const isNoRecipe = computed(() => props.cook && !props.cook.photo && !props.cook.category)

const dishImage = computed(() => {
  if (!props.cook) return { src: '/images/categories/other.png', isUploaded: false }
  if (isNoRecipe.value) return { src: CHEF_COOK, isUploaded: false }
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

function onBecomeCook() {
  if (props.cook || props.hasExistingQueue) return
  emit('become-cook')
  }
</script>