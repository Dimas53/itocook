<template>
  <div class="min-h-screen flex items-center justify-center bg-app-bg p-4">
    <div class="relative w-[390px] h-[844px] rounded-[50px] border-[6px] border-app-black shadow-2xl overflow-hidden bg-white">

      <div class="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-app-black rounded-full z-50"></div>

      <div
          class="absolute top-0 left-0 right-0 h-12 px-7 z-50 flex justify-between items-center pointer-events-none select-none"
      >
        <span class="text-[15px] text-black font-normal tracking-tight mt-[14px]">9:41</span>

        <img
            src="/images/ios_bar.svg"
            alt="status-bar"
            class="h-[12px] object-contain mt-[14px]"
            :class="{ 'invert': isDarkStatus }">
      </div>

      <div class="flex flex-col h-full">
        <div class="flex-1 overflow-y-auto scrollbar-hide">
          <slot />
        </div>
        <BottomTabBar v-if="showTabBar" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const hideTabBarRoutes = ['/onboarding', '/auth']
const showTabBar = computed(() => !hideTabBarRoutes.includes(route.path))

const isDarkStatus = computed(() => route.meta.darkStatus === true)
</script>
