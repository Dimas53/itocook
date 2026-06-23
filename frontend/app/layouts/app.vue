<template>
  <div class="iphone-frame min-h-screen flex items-center justify-center bg-app-bg p-4">
    <div class="iphone-screen relative w-[390px] h-[844px] rounded-[50px] border-[6px] border-app-black shadow-2xl overflow-hidden bg-app-bg">

      <!-- Phone brow / notch -->
      <div class="dynamic-island absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[34px] bg-app-black rounded-full z-50">
        <div class="absolute right-3 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-blue-900 opacity-80 shadow-[0_0_4px_1px_rgba(59,130,246,0.8)]"></div>
      </div>

      <!-- Top bar (safe area backdrop + status bar) -->
      <div class="status-bar absolute top-0 left-0 right-0 z-40 bg-app-bg" style="padding-top: env(safe-area-inset-top, 44px);">
        <div class="h-12 px-7 flex justify-between items-center pointer-events-none select-none">
          <span class="text-[15px] text-black font-normal tracking-tight mt-[14px]">9:41</span>
          <img
            :src="'/images/ios_bar.svg'"
            alt="status-bar"
            class="h-[12px] object-contain mt-[14px]"
          >
          </div>
      </div>

      <!-- Content area with top/bottom padding for notch + tab bar + safe area -->
      <div class="app-content h-full overflow-y-auto scrollbar-hide" style="padding-top: calc(48px + env(safe-area-inset-top, 44px));">
        <NuxtPage />
      </div>

      <!-- Floating bottom tab bar -->
      <BottomTabBar v-if="!isProfilePage && !isCookPage" />

      <!-- Participants modal (global, inside phone frame) -->
      <div
        v-if="pm.show"
        class="absolute inset-0 z-50 flex flex-col justify-end"
      >
        <div class="absolute inset-0 bg-black/40" @click="pm.close()" />
        <div class="relative bg-white rounded-t-2xl pb-8 px-5 pt-5 max-h-[60%] flex flex-col">
          <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3 shrink-0" />
          <div class="flex items-center gap-3 mb-4 shrink-0">
            <h3 class="text-[16px] font-semibold text-app-black">Participants</h3>
            <span class="bg-primary-pale text-primary rounded-full px-2 text-[13px] font-semibold">{{ pm.participants.length }}</span>
          </div>

          <div v-if="pm.loading" class="flex items-center justify-center py-8">
            <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>

          <template v-else-if="pm.participants.length === 0">
            <div class="flex flex-col items-center justify-center py-8">
              <p class="text-[13px] text-gray-400">No one has joined yet</p>
            </div>
          </template>

          <div v-else class="overflow-y-auto">
            <div
              v-for="p in pm.participants"
              :key="p.id"
              class="flex items-center gap-3 min-h-[48px]"
            >
              <img
                v-if="p.avatar"
                :src="`${directusUrl}/assets/${p.avatar}`"
                :alt="`${p.first_name ?? ''} ${p.last_name ?? ''}`"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div v-else class="w-8 h-8 rounded-full shrink-0 overflow-hidden">
                <AvatarPlaceholder />
              </div>
              <span class="text-[14px] font-medium text-app-black">
                {{ formatUserName(p) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * App layout — phone frame + bottom tab bar + global participants modal.
 * Wraps all authenticated pages.
 * Touches: `orders` (via useParticipantsModal).
 */
import { reactive } from 'vue'

const route = useRoute()
const router = useRouter()
const pm = reactive(useParticipantsModal())
const config = useRuntimeConfig()
const directusUrl = config.public.directusUrl

router.beforeEach(() => { pm.close() })

const isDarkStatus = computed(() => route.meta.darkStatus === true)
const isProfilePage = computed(() => route.path === '/profile')
const isCookPage = computed(() => route.path === '/cook')
</script>
