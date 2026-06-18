<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
      <h3 class="text-[16px] font-bold text-app-black mb-2">Action blocked</h3>
      <p class="text-[13px] text-app-black/70 leading-relaxed">{{ message }}</p>
      <div class="flex gap-3 mt-5">
        <button
          class="flex-1 h-11 rounded-full bg-primary text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
          @click="$emit('close')"
        >
          OK
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Modal overlay that shows when an action is blocked (e.g. balance too low).
 * Pure UI — no collections, no data fetching.
 */
defineProps<{
  show: boolean
  message: string
}>()

defineEmits<{
  close: []
}>()
</script>
