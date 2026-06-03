<template>
  <div class="p-5">
    <h1 class="text-[36px] font-bold text-app-black">
      Cook Panel
    </h1>
    <p class="text-[14px] text-gray-500 mt-2">
      You are today's cook!
    </p>
    <div class="mt-6 space-y-3">
      <div class="bg-primary-light rounded-2xl p-4">
        <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Today's Dish</p>
        <p class="text-[20px] font-semibold text-app-black mt-1">—</p>
      </div>
      <button
        class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] active:scale-[0.98] transition-transform mt-4"
      >
        I'm Cooking Today
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'app',
  darkStatus: false,
})
</script>
