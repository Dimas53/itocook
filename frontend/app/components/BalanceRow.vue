<script setup lang="ts">
interface BalanceUser {
  id: string
  first_name: string
  last_name: string
  avatar?: string
}

defineProps<{
  entry: { user: BalanceUser; amount: number }
  compact?: boolean
}>()

const config = useRuntimeConfig()
const directusUrl = config.public.directusUrl
</script>

<template>
  <div
    :class="[
      'bg-white border border-gray-100 px-4 flex items-center justify-between',
      compact ? 'rounded-xl h-full' : 'rounded-2xl h-14'
    ]"
  >
    <div class="flex items-center gap-2 min-w-0 flex-1">
      <img
        v-if="entry.user.avatar"
        :src="`${directusUrl}/assets/${entry.user.avatar}`"
        :alt="`${entry.user.first_name ?? ''} ${entry.user.last_name ?? ''}`"
        class="w-6 h-6 rounded-full object-cover shrink-0"
      />
      <div v-else class="w-6 h-6 rounded-full shrink-0 overflow-hidden">
        <AvatarPlaceholder />
      </div>
      <span class="text-[14px] text-app-black font-medium truncate">
        {{ entry.user.first_name }} {{ entry.user.last_name }}
      </span>
    </div>
    <span
      class="text-[14px] font-semibold shrink-0 ml-2"
      :class="entry.amount < 0 ? 'text-red-500' : 'text-green-600'"
    >
      <template v-if="entry.amount < 0">-€{{ Math.abs(entry.amount).toFixed(2) }}</template>
      <template v-else>€{{ entry.amount.toFixed(2) }}</template>
    </span>
  </div>
</template>
