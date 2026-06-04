<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="bg-green-pastel rounded-2xl p-4">
    <div class="h-3 w-20 bg-white/60 rounded-full animate-pulse" />
    <div class="h-5 w-28 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <!-- Data -->
  <div v-else class="bg-green-pastel rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform" @click="$emit('view')">
    <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Next Duty</p>
    <p class="text-[16px] font-semibold text-app-black mt-1">{{ name }}</p>
    <p class="text-[12px] text-app-black/60 mt-0.5">{{ date }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
  name: string
  date: string
}>()

defineEmits<{
  view: []
}>()
</script>
