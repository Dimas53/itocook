<template>
  <div
    class="bottom-tab-bar-wrapper bottom-tab-bar left-4 right-4 z-50 h-[64px] flex items-center justify-between px-4"
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
/**
 * Bottom navigation bar with 5 tabs (Home, Kitchen, AI/Finance, Duty, Common).
 * Checks user role to determine Finance tab visibility.
 * No collections directly — uses auth state.
 */
import {
  PhCookingPot,
  PhCalendarBlank,
  PhSparkle,
  PhChartBar,
  PhBroom,
  PhUsers,
} from '@phosphor-icons/vue'

const router = useRouter()
const route = useRoute()
const { user } = useAuth()

// ── isFinanceRole ───────────────────────────────────────────────────────
// directus api — user.value.role сравнивается с UUID роли User
// Если роль отличается — значит юзер Admin/Accountant → показываем Finance
const isFinanceRole = computed(() => {
  return user.value?.role && user.value.role !== '1927ae8a-4442-4097-91ce-0c290b3fc1d4'
})

const tabs = computed(() => [
  { id: 'home', icon: PhCookingPot, route: '/' },
  { id: 'kitchen', icon: PhCalendarBlank, route: '/kitchen' },
  {
    id: 'ai-recipe',
    icon: isFinanceRole.value ? PhChartBar : PhSparkle,
    route: isFinanceRole.value ? '/finance' : '/ai-recipe',
  },
  { id: 'duty', icon: PhBroom, route: '/duty' },
  { id: 'common', icon: PhUsers, route: '/common' },
])

const activeTab = computed(() => {
  const path = route.path
  const match = tabs.value.find(t => t.route === path)
  return match ? match.id : 'home'
})

function navigate(path: string) {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>
