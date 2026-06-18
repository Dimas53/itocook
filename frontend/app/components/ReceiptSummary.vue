<script setup lang="ts">
/**
 * Displays cost breakdown: pasta add-on, participant count, share per person.
 * Pure presentation — receives data via props from useDeduction.
 */
interface PastaItem {
  label: string
  amount: number
}

defineProps<{
  pastaBreakdown?: PastaItem | null
  participantsCount: number
  sharePerPerson: string
}>()
</script>

<template>
  <div class="space-y-2">
    <div v-if="pastaBreakdown" class="flex justify-between text-[14px]">
      <span class="text-gray-500">{{ pastaBreakdown.label }}</span>
      <span class="font-semibold text-app-black">€{{ pastaBreakdown.amount.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between text-[14px]">
      <span class="text-gray-500">Participants</span>
      <span class="font-semibold text-app-black">{{ participantsCount }}</span>
    </div>
    <div class="flex justify-between text-[14px]">
      <span class="text-gray-500">Share per person</span>
      <span class="font-semibold text-app-black">€{{ sharePerPerson }}</span>
    </div>
  </div>
</template>
