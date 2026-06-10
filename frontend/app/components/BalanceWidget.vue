<template>
  <!-- Loading skeleton -->
  <div v-if="loading" class="bg-primary-pale rounded-2xl p-4">
    <div class="h-3 w-16 bg-white/60 rounded-full animate-pulse" />
    <div class="h-6 w-24 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <!-- Data -->
  <div v-else class="bg-primary-pale rounded-2xl p-4">
    <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">My Balance</p>
    <p class="text-[20px] font-semibold text-app-black mt-1">{{ formattedAmount }}</p>
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

// ── fetchBalance ────────────────────────────────────────────────────────
// directus api — GET /items/balances с фильтром по текущему юзеру
// Берёт первую запись баланса для этого пользователя и показывает её
// в мини-виджете на главном экране (index.vue).
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
  return `€${val.toFixed(2)}`
})

onMounted(fetchBalance)
</script>
