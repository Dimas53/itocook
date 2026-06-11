<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg p-4">
    <div class="relative w-[390px] h-[844px] rounded-[50px] border-[6px] border-app-black shadow-2xl overflow-hidden bg-white">

      <!-- Phone brow / notch -->
      <div class="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-app-black rounded-full z-50">
        <div class="absolute right-3 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-blue-900 opacity-80 shadow-[0_0_4px_1px_rgba(59,130,246,0.8)]"></div>
      </div>

      <!-- Top bar (safe area backdrop + status bar) -->
      <div class="absolute top-0 left-0 right-0 z-40 bg-white" style="padding-top: env(safe-area-inset-top, 44px);">
        <div class="h-12 px-7 flex justify-between items-center pointer-events-none select-none">
          <span class="text-[15px] text-black font-normal tracking-tight mt-[14px]">9:41</span>
          <img
            src="/images/ios_bar.svg"
            alt="status-bar"
            class="h-[12px] object-contain mt-[14px]"
          >
          </div>
      </div>

      <!-- Content area with top/bottom padding for notch + tab bar + safe area -->
      <div class="h-full overflow-y-auto scrollbar-hide pb-[100px]" style="padding-top: calc(48px + env(safe-area-inset-top, 44px));">
        <NuxtPage />
      </div>

      <!-- Floating bottom tab bar -->
      <BottomTabBar v-if="!isProfilePage" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const isDarkStatus = computed(() => route.meta.darkStatus === true)
const isProfilePage = computed(() => route.path === '/profile')
</script>
