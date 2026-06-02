<template>
  <div class="h-[70px] bg-white border-t border-gray-100 flex items-center justify-around px-2 shrink-0">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="navigate(tab.route)"
      class="flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] transition-transform"
    >
      <component :is="tab.icon" :class="activeTab === tab.id ? 'text-primary' : 'text-gray-400'" class="size-6" weight="regular" />
      <span :class="activeTab === tab.id ? 'text-primary font-semibold' : 'text-gray-400 font-normal'" class="text-[10px]">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { PhHouse, PhForkKnife, PhSparkle, PhNotebook, PhBooks } from '@phosphor-icons/vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { id: 'home', label: 'Home', icon: PhHouse, route: '/' },
  { id: 'meal-plan', label: 'Meal Plan', icon: PhForkKnife, route: '/meal-plan' },
  { id: 'ai-recipe', label: 'AI Recipe', icon: PhSparkle, route: '/ai-recipe' },
  { id: 'journal', label: 'Journal', icon: PhNotebook, route: '/journal' },
  { id: 'learning', label: 'Learning', icon: PhBooks, route: '/learning' },
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
