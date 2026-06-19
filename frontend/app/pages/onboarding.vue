<template>
  <div class="h-full bg-primary overflow-hidden flex flex-col">
    <!-- Hero Zone (Top 50%) -->
    <div class="h-[50%] mt-16 flex items-center justify-center">
      <img src="/images/onboarding/chef-cook.png" alt="Chef" class="w-full h-full object-contain" />
    </div>


    <!-- Logo -->
    <div class="px-5 flex justify-start">
      <img
        src="/images/onboarding/itocook-logo.png"
        alt="itocook"
        class=" -mt-12 object-contain"
      />
    </div>

    <!-- Title -->
    <div class="px-5 mt-3">
      <h1 class="font-bold text-[40px] text-white leading-[1.1]">
        Cook. Split. Done.
      </h1>
    </div>

    <!-- Description Block -->
    <div class="px-5 mt-3">
      <p class="text-[14px] text-white/85 font-normal">
        🔥 One tap to join lunch. One app to handle the rest.
      </p>
    </div>

    <!-- Bottom Button -->
    <div class="pb-[34px] px-5 w-full mt-auto">
      <button @click="proceed" class="w-full bg-white h-14 rounded-full flex items-center justify-between px-2 shadow-sm active:scale-[0.98] transition-transform">
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
/**
 * Onboarding page — initial welcome screen with brand intro.
 * No data collections — purely presentational.
 */
import { PhChefHat } from '@phosphor-icons/vue'

definePageMeta({ layout: 'default' })

const { tokenCookie } = useDirectus()

async function proceed() {
  const token = tokenCookie.value
  if (token) {
    await navigateTo('/')
  } else {
    await navigateTo('/auth')
  }
}

onMounted(() => {
  setTimeout(proceed, 2500)
})
</script>