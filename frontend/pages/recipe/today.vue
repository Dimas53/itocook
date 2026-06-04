<template>
  <div class="flex flex-col h-full">

    <!-- Photo -- fixed top -->
    <div class="bg-primary-light h-[320px] relative shrink-0">
      <div class="absolute inset-0 p-2">
        <img
          v-if="dish.photo"
          :src="dish.photo"
          alt="Dish"
          class="w-full h-full object-contain"
        />
      </div>
      <button
        class="absolute left-5 top-12 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center"
        @click="router.back()"
      >
        <PhCaretLeft class="w-5 h-5 text-app-black" weight="bold" />
      </button>
      <button class="absolute right-5 top-12 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
        <PhHeart class="w-5 h-5 text-app-black" weight="regular" />
      </button>
    </div>

    <!-- White card -- scrollable middle -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      <div class="rounded-t-3xl -mt-4 bg-white px-5 pt-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <!-- Title + rating -->
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-[22px] font-bold text-app-black">
            {{ dish.name }}
          </h1>
          <div class="flex items-center gap-1">
            <PhStar class="w-4 h-4 text-secondary" weight="fill" />
            <span class="text-[14px] font-semibold text-app-black">{{ dish.rating }}</span>
          </div>
        </div>

        <!-- Cook row -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2.5">
            <img
              :src="`https://i.pravatar.cc/200?u=${dish.cook}`"
              :alt="dish.cook"
              class="w-8 h-8 rounded-full"
            />
            <div>
              <p class="text-[14px] font-semibold text-app-black leading-tight">{{ dish.cook }}</p>
              <p class="text-[11px] text-app-black/50">Chef</p>
            </div>
          </div>
          <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
            <PhChefHat class="w-5 h-5 text-primary" weight="fill" />
          </div>
        </div>

        <!-- Description -->
        <div class="mb-5">
          <h3 class="text-[14px] font-semibold text-app-black mb-2">Description</h3>
          <p class="text-[14px] text-app-black/70 leading-relaxed">
            {{ dish.description }}
          </p>
        </div>

        <!-- Ingredients -->
        <div>
          <button
            class="flex items-center justify-between w-full mb-2"
            @click="showIngredients = !showIngredients"
          >
            <h3 class="text-[14px] font-semibold text-app-black">Ingredients</h3>
            <PhCaretDown
              class="w-4 h-4 text-app-black/50 transition-transform"
              :class="showIngredients ? 'rotate-180' : ''"
              weight="bold"
            />
          </button>
          <ul v-if="showIngredients" class="space-y-1.5">
            <li v-for="item in dish.ingredients" :key="item" class="text-[14px] text-app-black/70">
              <span class="mr-2">·</span>{{ item }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Join button -- fixed bottom -->
    <div class="shrink-0 bg-white px-5 py-4 border-t border-gray-100">
      <button
        class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
        @click="onJoin"
      >
        <PhForkKnife class="w-5 h-5" weight="fill" />
        <span>{{ joined ? 'Joined ✓' : 'Join lunch' }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhHeart, PhStar, PhChefHat, PhForkKnife, PhCaretDown } from '@phosphor-icons/vue'

definePageMeta({ layout: 'default' })

const router = useRouter()

const dish = {
  name: 'Caesar Salad',
  cook: 'Admin',
  photo: '/images/salat.png',
  rating: 4.8,
  description: 'Classic salad with crispy romaine leaves, tender chicken breast, parmesan and homemade Caesar dressing. Prepared fresh every day.',
  ingredients: [
    '200g chicken breast',
    '100g romaine leaves',
    '50g grated parmesan',
    '2 tbsp Caesar dressing',
    '1 tbsp croutons',
    'salt and pepper to taste',
  ],
}

const joined = ref(false)
const showIngredients = ref(false)

function onJoin() {
  if (joined.value) return
  joined.value = true
}
</script>
