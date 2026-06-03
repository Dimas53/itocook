<template>
<!--  <div-->
<!--    class="fixed left-4 right-4 z-50 rounded-3xl h-[64px] backdrop-blur-md bg-black/30 flex items-center justify-between px-4"-->
<!--    :style="{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }"-->
<!--  >-->

  <div
      class="absolute left-4 right-4 z-50 rounded-3xl h-[64px] backdrop-blur-md bg-black/30 flex items-center justify-between px-4"
      :style="{ bottom: '16px' }"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="navigate(tab.route)"
      class="flex items-center justify-center active:scale-[0.98] transition-transform"
      :class="activeTab === tab.id ? 'bg-white rounded-full w-12 h-12' : 'w-12 h-12'"
    >
      <component
        :is="tab.icon"
        weight="fill"
        :class="activeTab === tab.id ? 'text-app-black size-5' : 'text-white/80 size-5'"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PhChefHat, PhCalendarDots, PhStarFour, PhNotepad, PhBookOpenText } from '@phosphor-icons/vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { id: 'home', icon: PhChefHat, route: '/' },
  { id: 'meal-plan', icon: PhCalendarDots, route: '/meal-plan' },
  { id: 'ai-recipe', icon: PhStarFour, route: '/ai-recipe' },
  { id: 'journal', icon: PhNotepad, route: '/journal' },
  { id: 'learning', icon: PhBookOpenText, route: '/learning' },
]

const activeTab = computed(() => {
  const path = route.path
  const match = tabs.find(t => t.route === path)
  return match ? match.id : 'home'
})

function navigate(path: string) {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>
