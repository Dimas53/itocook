<template>
  <div class="h-full bg-primary overflow-hidden flex flex-col">
    <!-- Hero Zone (Top 50%) -->
    <div class="h-[50%] mt-10 flex items-center justify-center">
      <img src="/images/onboarding/chef-cook.png" alt="Chef" class="w-full h-full object-contain" />
    </div>

    <!-- Content Zone (Flex Row) -->
<!--    <div class="flex-1 px-5 flex items-start justify-between gap-4 min-h-0">
      <div>
        <h1 class="font-bold text-[36px] text-white leading-[1.1]">
          Quick<br />& Easy<br />Recipes! 🔥
        </h1>
        <p class="text-[14px] text-white/85 font-normal mt-4 max-w-[200px]">
          Quick and easy recipes save time, taste great, and bring smiles.
        </p>
      </div>
      <img src="/images/onboarding/sauce_frame.png" alt="Sauce" class="w-[140px] object-contain self-start" />
    </div>-->
    <!-- Content Zone (Flex Row) -->
    <!-- Title + Image Row -->
    <!-- Title + Image Row -->
    <div class="px-5 flex items-center justify-between">
      <h1 class="font-bold text-[38px] text-white leading-[1.35] tracking-tight">
        Quick<br />& Easy<br />Recipes!
      </h1>
      <img src="/images/onboarding/sauce_frame.png" alt="Sauce" class="w-full object-contain self-start"></div>

    <!-- Description Block -->
    <div class="px-5 mt-3">
      <p class="text-[14px] text-white/85 font-normal max-w-[270px]">
        🔥 Quick and easy recipes save time, taste great, and bring smiles.
      </p>
    </div>

    <!-- Bottom Button -->
    <div class="pb-[34px] px-5 w-full mt-auto">
      <button @click="navigateTo('/auth')" class="w-full bg-white h-14 rounded-full flex items-center justify-between px-2 shadow-sm active:scale-[0.98] transition-transform">
        <div class="bg-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          <PhChefHat class="text-white size-5" />
        </div>
        <span class="font-semibold text-[16px] text-app-black">Get Started</span>
        <span class="text-gray-400 text-sm pr-4">&gt;&gt;&gt;</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhChefHat } from '@phosphor-icons/vue'
</script>