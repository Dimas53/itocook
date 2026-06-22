<script setup lang="ts">
import { PhBell, PhBellRinging } from '@phosphor-icons/vue'

const router = useRouter()
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
