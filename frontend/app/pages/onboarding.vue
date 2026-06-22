<template>
  <div
    class="h-full overflow-hidden flex flex-col relative"
    style="background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, #8966FA 0%, #5B3FD4 100%); background-size: 24px 24px, 100% 100%;"
  >
    <!-- Hero Zone (Top 50%) -->
    <div class="h-[50%] mt-16 flex items-center justify-center">
      <img src="/images/onboarding/chef-cook.png" alt="Chef" class="w-full h-full object-contain" />
    </div>

    <!-- Logo -->
    <div class="px-5 flex justify-start">
      <img
        src="/images/onboarding/itocook-logo.png"
        alt="itocook"
        class=" -mt-8 object-contain"
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
      <button
        class="w-full h-14 rounded-full glass flex items-center justify-between px-2 active:scale-[0.98] transition-transform"
        :disabled="isAnimating"
        @click="handleClick"
      >
        <div
          class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"
          :style="{ transform: `translateX(${iconX}px)`, transition: iconTransition }"
        >
          <PhChefHat class="text-white size-5" weight="fill" />
        </div>
        <span class="font-semibold text-[16px] text-white" :class="{ 'opacity-0': isAnimating }">Get Started</span>
        <span class="text-white/60 text-sm" :class="{ 'opacity-0': isAnimating }">&gt;&gt;&gt;</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// onMounted(() => {
//   setTimeout(proceed, 3000)
// })
// ⚠️ Auto-redirect disabled for testing. Onboarding stays until button click.
// Restore the timeout above when done testing.

const isAnimating = ref(false)
const iconX = ref(0)
const iconTransition = ref('none')

async function handleClick() {
  if (isAnimating.value) return
  isAnimating.value = true

  // Slide icon across the button (~280px = full button width minus padding)
  iconTransition.value = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  iconX.value = 280

  setTimeout(() => proceed(), 320)
}
</script>
