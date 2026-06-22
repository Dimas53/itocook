<script setup lang="ts">
import { PhBellSlash, PhCheck, PhCookingPot, PhForkKnife, PhSun, PhWarning, PhBroom, PhClock, PhUserPlus } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

const { notifications, loading, fetchNotifications, markAllAsRead } = useNotifications()

const ICON_MAP: Record<string, { icon: object; bg: string; color: string }> = {
  cook_assigned:   { icon: PhCookingPot,   bg: 'bg-green-pastel',   color: 'text-green-700' },
  lunch_ready:     { icon: PhForkKnife,    bg: 'bg-yellow-pastel',  color: 'text-yellow-700' },
  morning_reminder:{ icon: PhSun,          bg: 'bg-primary-light',   color: 'text-primary' },
  balance_low:     { icon: PhWarning,      bg: 'bg-red-50',         color: 'text-red-500' },
  duty_reminder:   { icon: PhBroom,        bg: 'bg-primary-pale',   color: 'text-primary' },
  cook_reminder:   { icon: PhClock,        bg: 'bg-yellow-pastel',  color: 'text-yellow-700' },
  join_pending:    { icon: PhUserPlus,     bg: 'bg-green-light',    color: 'text-green-700' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return days + 'd ago'
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center justify-between px-5 pb-4">
      <h1 class="text-[36px] font-bold text-app-black">Notifications</h1>
      <button
        v-if="notifications.some(n => !n.read)"
        class="text-[14px] text-primary font-semibold active:scale-[0.98] transition-transform"
        @click="markAllAsRead"
      >
        Mark all read
      </button>
    </div>

    <div class="px-5 pb-[100px]">

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 w-3/4 bg-gray-100 rounded-full" />
              <div class="h-2 w-1/4 bg-gray-100 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center pt-20">
        <PhBellSlash class="w-12 h-12 text-gray-300" />
        <p class="text-[14px] text-gray-400 mt-3">No notifications yet</p>
      </div>

      <!-- Notifications list -->
      <div v-else class="space-y-3">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="rounded-2xl p-4 shadow-sm"
          :class="n.read ? 'bg-white opacity-60' : 'bg-primary-pale/30 border-l-4 border-primary'"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              :class="ICON_MAP[n.type]?.bg || 'bg-gray-100'"
            >
              <component
                :is="ICON_MAP[n.type]?.icon || PhBellSlash"
                class="w-4 h-4"
                :class="ICON_MAP[n.type]?.color || 'text-gray-500'"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] text-app-black">{{ n.message }}</p>
              <p class="text-[12px] text-gray-400 mt-0.5">{{ timeAgo(n.date_created) }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
