<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="rounded-2xl p-4" :class="skeletonBg">
    <div class="h-3 w-16 bg-white/60 rounded-full animate-pulse" />
    <div class="h-6 w-24 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <!-- Data -->
  <div v-else class="rounded-2xl p-4" :class="cardClass">
    <p class="text-[12px] font-medium uppercase tracking-wide" :class="labelClass">My Balance</p>
    <p class="text-[20px] font-semibold mt-1" :class="valueClass">{{ formattedAmount }}</p>
  </div>
</template>

<script setup lang="ts">
const { request } = useDirectus()
const { user } = useAuth()

const loading = ref(true)
const balance = ref<number | null>(null)

interface BalanceItem {
  id: string
  amount: string
}

async function fetchBalance() {
  if (!user.value) {
    loading.value = false
    return
  }
  try {
    const items = await request<BalanceItem[]>('get', `/items/balances?filter[user][_eq]=${user.value.id}&limit=1`)
    if (items.length > 0) {
      const first = items[0]
      balance.value = first ? Number(first.amount) : 0
    }
  } catch {
    balance.value = null
  } finally {
    loading.value = false
  }
}

const formattedAmount = computed(() => {
  const val = balance.value ?? 0
  const sign = val < 0 ? '-' : ''
  return `${sign}€${Math.abs(val).toFixed(2)}`
})

const cardClass = computed(() => {
  const val = balance.value
  if (val === null) return 'bg-primary-pale'
  if (val >= 5) return 'bg-primary-pale'
  if (val >= 0) return 'bg-red-50'
  return 'bg-red-100'
})

const labelClass = computed(() => {
  const val = balance.value
  if (val === null) return 'text-app-black/60'
  if (val >= 5) return 'text-app-black/60'
  if (val >= 0) return 'text-red-700/60'
  return 'text-red-700/60'
})

const valueClass = computed(() => {
  const val = balance.value
  if (val === null) return 'text-app-black'
  if (val >= 5) return 'text-app-black'
  if (val >= 0) return 'text-red-700'
  return 'text-red-600'
})

const skeletonBg = computed(() => {
  return 'bg-primary-pale'
})

onMounted(fetchBalance)
</script>
