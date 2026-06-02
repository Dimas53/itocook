<template>
  <div class="p-5">
    <h1 class="text-[36px] font-bold text-app-black">
      Hello, {{ user?.first_name || 'there' }}!
    </h1>
    <p class="text-[14px] text-gray-500 mt-2">
      {{ user?.email }}
    </p>
    <div class="mt-6 space-y-3">
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
const { user, isTodayCook } = useAuth()

onMounted(async () => {
  if (await isTodayCook()) {
    await navigateTo('/cook')
  }
})
</script>
