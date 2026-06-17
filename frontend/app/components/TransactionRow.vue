<script setup lang="ts">
interface TxUser {
  id: string
  first_name: string
  last_name: string
}

defineProps<{
  tx: {
    id: string
    amount: string
    type: string
    description: string
    date: string
    user: TxUser | null
  }
  compact?: boolean
}>()

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function txAmount(tx: { amount: string }): { value: number; isPositive: boolean } {
  const n = Number(tx.amount)
  return { value: n, isPositive: n >= 0 }
}
</script>

<template>
  <div
    :class="[
      'bg-white border border-gray-100',
      compact ? 'rounded-xl p-3 flex flex-col justify-center h-full' : 'rounded-2xl p-4'
    ]"
  >
    <div class="flex items-center justify-between">
      <span class="text-[12px] text-gray-500">{{ formatDate(tx.date) }}</span>
      <span
        class="text-[14px] font-semibold"
        :class="txAmount(tx).isPositive ? 'text-green-600' : 'text-red-500'"
      >
        {{ txAmount(tx).isPositive ? '+' : '-' }}€{{ Math.abs(txAmount(tx).value).toFixed(2) }}
      </span>
    </div>
    <div class="flex items-center justify-between mt-1">
      <span class="text-[14px] text-app-black font-medium">
        {{ tx.user?.first_name }} {{ tx.user?.last_name }}
      </span>
      <span class="text-[12px] text-gray-400 capitalize">{{ tx.type }}</span>
    </div>
    <p v-if="!compact && tx.description" class="text-[12px] text-gray-400 mt-1 truncate">
      {{ tx.description }}
    </p>
  </div>
</template>
