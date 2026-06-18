<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="rounded-2xl p-4 relative overflow-hidden" :class="skeletonBg">
    <div class="h-3 w-16 bg-white/60 rounded-full animate-pulse" />
    <div class="h-6 w-24 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <!-- Data -->
  <div v-else class="rounded-2xl p-4 flex flex-col justify-around relative overflow-hidden" :class="cardClass">
    <svg
      class="absolute -left-4 -top-4 w-16 h-16 z-0 opacity-20 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
    </svg>
    <p class="text-[12px] font-medium uppercase tracking-wide" :class="labelClass">My Balance</p>
    <p class="text-3xl  font-semibold mt-1" :class="valueClass">{{ formattedAmount }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard widget showing current user balance with color coding.
 * Touches `balances` collection.
 */
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
