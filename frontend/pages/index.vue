<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center justify-between px-5 pb-5 cursor-pointer" @click="router.push('/profile')">
      <div class="flex items-center gap-3">
        <img
          :src="avatarUrl"
          alt="avatar"
          class="w-10 h-10 rounded-full bg-primary ring-2 ring-primary"
        />
        <div>
          <p class="text-[14px] text-gray-500">Hello</p>
          <p class="text-[20px] font-semibold text-app-black -mt-1">
            {{ user?.first_name || 'there' }}
          </p>
        </div>
      </div>
      <button class="w-10 h-10 flex items-center justify-center" @click.stop>
        <PhBell class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-[100px] space-y-6">
      <div class="bg-primary-light rounded-2xl p-4">
        <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Balance</p>
        <p class="text-[20px] font-semibold text-app-black mt-1">€0.00</p>
      </div>
      <div class="bg-green-pastel rounded-2xl p-4">
        <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Today's Cook</p>
        <p class="text-[20px] font-semibold text-app-black mt-1">—</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

import { PhBell } from '@phosphor-icons/vue'

const router = useRouter()
const { user, isTodayCook } = useAuth()

const avatarUrl = computed(() =>
  `https://i.pravatar.cc/200?u=${user.value?.email}`
)

onMounted(async () => {
  if (await isTodayCook()) {
    await navigateTo('/cook')
  }
})
</script>