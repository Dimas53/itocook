<script setup lang="ts">
/**
 * NotificationBell.vue
 *
 * Renders a bell icon button with an unread badge (count).
 * Shows PhBellRinging when unread > 0, PhBell otherwise.
 * Tap navigates to /notifications page.
 *
 * Used in: layouts/app.vue (header), all app pages via layout header slot.
 *
 * Polling: unreadCount comes from useNotifications composable which polls every 20s.
 * This component is a pure presentation layer — it does not trigger any data fetching.
 */
import { PhBell, PhBellRinging } from '@phosphor-icons/vue'

const router = useRouter()
// Polls every 20s via useNotifications — short enough to feel responsive,
// long enough to avoid unnecessary API load on Directus.
const { unreadCount } = useNotifications()

function goNotifications() {
  router.push('/notifications')
}
</script>

<template>
  <button class="w-10 h-10 flex items-center justify-center relative active:scale-[0.98] transition-transform" @click.stop="goNotifications">
    <PhBellRinging v-if="unreadCount > 0" class="w-6 h-6 text-app-black" />
    <PhBell v-else class="w-6 h-6 text-app-black" />
    <span
      v-if="unreadCount > 0"
      class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-semibold"
    >
      {{ unreadCount > 9 ? '9+' : unreadCount }}
    </span>
  </button>
</template>
