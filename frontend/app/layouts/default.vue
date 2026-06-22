<template>
  <div class="iphone-frame min-h-screen flex items-center justify-center bg-app-bg p-4">
    <div class="iphone-screen relative w-[390px] h-[844px] rounded-[50px] border-[6px] border-app-black shadow-2xl overflow-hidden bg-app-bg">

      <!-- Phone brow / notch -->
      <div class="dynamic-island absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-app-black rounded-full z-50">
        <!-- Camera / sensor indicator -->
        <div class="absolute right-3 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-blue-900 opacity-80 shadow-[0_0_4px_1px_rgba(59,130,246,0.8)]"></div>
      </div>

      <!-- Status bar (time + icons) — transparent overlay, no white backdrop -->
      <div class="status-bar absolute top-0 left-0 right-0 h-12 px-7 z-50 flex justify-between items-center pointer-events-none select-none">
        <span class="text-[15px] text-black font-normal tracking-tight mt-[14px]">9:41</span>
        <img
          src="/images/ios_bar.svg"
          alt="status-bar"
          class="h-[12px] object-contain mt-[14px]"
        >
      </div>

      <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto scrollbar-hide">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Default layout — phone frame without bottom tab bar.
 * Used for onboarding, auth, and recipe list pages.
 */
const route = useRoute()

const isDarkStatus = computed(() => route.meta.darkStatus === true)
</script>
