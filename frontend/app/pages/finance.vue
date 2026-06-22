<script setup lang="ts">
/**
 * Finance admin page — balances, transactions, top-up, pasta price editor.
 * Touches: `balances`, `transactions`, `app_settings`, `directus_users`.
 */
import { PhArrowUp, PhBell, PhCheck, PhFloppyDisk } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

const { request } = useDirectus()

// ── Types ──────────────────────────────────────────────────────────────────
interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  avatar?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
interface BalanceRecord {
  id: string
  amount: string
  user: DirectusUser
}

interface TransactionRecord {
  id: string
  amount: string
  type: string
  description: string
  date: string
  user: DirectusUser
}

interface BalanceEntry {
  user: DirectusUser
  amount: number
  balanceId: string | null
}

// ── Users ──────────────────────────────────────────────────────────────────
const users = ref<DirectusUser[]>([])
const loadingUsers = ref(true)

async function fetchUsers() {
  loadingUsers.value = true
  try {
    const res = await fetch('/api/users/list')
    const data = await res.json()
    users.value = data.users ?? []
  } catch {
    users.value = []
  }
  loadingUsers.value = false
}

// ── Balances ───────────────────────────────────────────────────────────────
const allBalances = ref<BalanceRecord[]>([])
const loadingBalances = ref(true)

async function fetchBalances() {
  loadingBalances.value = true
  try {
    const items = await request<BalanceRecord[]>(
      'get',
      '/items/balances?fields=*,user.id,user.first_name,user.last_name,user.avatar'
    )
    allBalances.value = items ?? []
  } catch {
    allBalances.value = []
  }
  loadingBalances.value = false
}

const balanceEntries = computed<BalanceEntry[]>(() => {
  const map = new Map<string, BalanceRecord>()
  for (const b of allBalances.value) {
    if (b.user) map.set(b.user.id, b)
  }
  const entries: BalanceEntry[] = users.value.map((u) => {
    const record = map.get(u.id)
    return {
      user: u,
      amount: record ? Number(record.amount) : 0,
      balanceId: record ? record.id : null,
    }
  })
  entries.sort((a, b) => a.amount - b.amount)
  return entries
})

// ── Transactions ───────────────────────────────────────────────────────────
const transactions = ref<TransactionRecord[]>([])
const loadingTransactions = ref(true)

async function fetchTransactions() {
  loadingTransactions.value = true
  try {
    const items = await request<TransactionRecord[]>(
      'get',
      '/items/transactions?fields=*,user.id,user.first_name,user.last_name&sort[]=-date&limit=50'
    )
    transactions.value = items ?? []
  } catch {
    transactions.value = []
  }
  loadingTransactions.value = false
}

// ── Pasta Package Price ────────────────────────────────────────────────────
const pastaPrice = ref<number | null>(null)
const pastaPriceEdit = ref(1.00)
const priceSaved = ref(false)

async function fetchPastaPrice() {
  try {
    const res = await fetch('/api/settings/pasta-price')
    const data = await res.json()
    const p = data.price ?? 1.00
    pastaPrice.value = p
    pastaPriceEdit.value = p
  } catch {
    pastaPrice.value = null
  }
}

async function savePastaPrice() {
  priceSaved.value = false
  try {
    const res = await fetch('/api/settings/pasta-price', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: pastaPriceEdit.value }),
    })
    if (res.ok) {
      pastaPrice.value = pastaPriceEdit.value
      priceSaved.value = true
      setTimeout(() => { priceSaved.value = false }, 2000)
    }
  } catch {
    // silent
  }
}

// ── Manual Top-up ─────────────────────────────────────────────────────────
const selectedUserId = ref('')
const topupAmount = ref(0)
const topupNote = ref('')
const topupSubmitting = ref(false)
const topupSuccess = ref(false)
const topupError = ref('')

async function submitTopup() {
  if (!selectedUserId.value || topupAmount.value === 0) return
  topupSubmitting.value = true
  topupSuccess.value = false
  topupError.value = ''
  const amount = topupAmount.value
  const type = amount > 0 ? 'credit' : 'debit'
  const description = topupNote.value.trim() || 'Manual balance adjustment'

  try {
    await request('post', '/items/transactions', {
      user: selectedUserId.value,
      amount,
      type,
      description,
      date: new Date().toISOString(),
    })

    const existing = await request<BalanceRecord[]>(
      'get',
      `/items/balances?filter[user][_eq]=${selectedUserId.value}&limit=1`
    )
    const record = existing[0]
    if (record) {
      const currentAmount = Number(record.amount)
      await request('PATCH', `/items/balances/${record.id}`, {
        amount: currentAmount + amount,
      })
    } else {
      await request('post', '/items/balances', {
        user: selectedUserId.value,
        amount,
      })
    }

    topupSuccess.value = true
    topupAmount.value = 0
    topupNote.value = ''
    selectedUserId.value = ''
    setTimeout(() => { topupSuccess.value = false }, 3000)
    await Promise.all([fetchBalances(), fetchTransactions()])
  } catch (e) {
    topupError.value = 'Failed to process top-up. Please try again.'
    console.error('Top-up error:', e)
  }
  topupSubmitting.value = false
}

// ── Expand state for slider/expanded toggle ───────────────────────────────
const transactionsExpanded = ref(false)
const balancesExpanded = ref(false)

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchUsers(), fetchBalances(), fetchTransactions(), fetchPastaPrice()])
})
</script>

<template>
  <div class="h-full overflow-y-auto scrollbar-hide">
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Administration</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">Finance</h1>
      </div>
      <button class="w-10 h-10 flex items-center justify-center">
        <PhBell class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="space-y-6 pb-8 px-5">

      <!-- ── Balances Overview ──────────────────────────────────────────── -->
      <div>
        <h2 class="text-[20px] font-semibold text-app-black mb-3">Balances</h2>
        <div v-if="loadingUsers || loadingBalances" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-14 bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
            <div class="h-3 w-28 bg-gray-100 rounded-full animate-pulse" />
            <div class="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div v-else-if="balanceEntries.length === 0" class="text-center text-[14px] text-gray-400 py-6">
          No users found
        </div>
        <div v-else class="space-y-1">

          <!-- Slider mode -->
          <template v-if="!balancesExpanded">
            <SliderList :items="balanceEntries" :visible-count="5" :item-height="56">
              <template #item="{ item: entry }">
                <BalanceRow :entry="entry" :compact="true" />
              </template>
            </SliderList>
            <button
              v-if="balanceEntries.length > 5"
              class="w-full flex items-center justify-center gap-1 mt-2 text-[13px] text-gray-400 font-medium active:text-app-black transition-colors active:scale-[0.98]"
              @click="balancesExpanded = true"
            >
              Show all ({{ balanceEntries.length }})
            </button>
          </template>

          <!-- Expanded mode -->
          <template v-else>
            <div class="space-y-2">
              <div
                v-for="entry in balanceEntries"
                :key="entry.user.id"
              >
                <BalanceRow :entry="entry" />
              </div>
            </div>
            <button
              class="w-full flex items-center justify-center gap-1 mt-3 text-[13px] text-gray-400 font-medium active:text-app-black transition-colors active:scale-[0.98]"
              @click="balancesExpanded = false"
            >
              Show less
            </button>
          </template>

        </div>
      </div>

      <!-- ── Manual Top-up ──────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl p-4 border border-gray-100">
        <h2 class="text-[20px] font-semibold text-app-black mb-4">Manual Top-up</h2>
        <div class="space-y-3">
          <select
            v-model="selectedUserId"
            class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black focus:outline-none focus:border-primary appearance-none"
          >
            <option value="" disabled>Select user</option>
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.first_name }} {{ u.last_name }}
            </option>
          </select>

          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 font-semibold">€</span>
            <input
              v-model.number="topupAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="w-full h-12 rounded-xl bg-white border border-gray-200 pl-8 pr-4 text-[14px] text-app-black placeholder:text-gray-300 focus:outline-none focus:border-primary"
            />
          </div>
          <p class="text-[11px] text-gray-400 -mt-1">Use positive for credit, negative for debit (correction)</p>

          <input
            v-model="topupNote"
            type="text"
            placeholder="Note (optional)"
            class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
          />

          <button
            @click="submitTopup"
            :disabled="topupSubmitting || !selectedUserId || topupAmount === 0"
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <PhArrowUp :size="20" weight="bold" />
            {{ topupSubmitting ? 'Processing...' : 'Submit' }}
          </button>

          <p v-if="topupSuccess" class="text-[13px] text-green-600 flex items-center gap-1">
            <PhCheck :size="16" weight="bold" />
            Top-up processed successfully
          </p>
          <p v-if="topupError" class="text-[13px] text-red-500">{{ topupError }}</p>
        </div>
      </div>

      <!-- ── Pasta Package Price ────────────────────────────────────────── -->
      <div v-if="pastaPrice !== null" class="bg-white rounded-2xl p-4 border border-gray-100">
        <h2 class="text-[14px] font-semibold text-app-black mb-3">Pasta Package Price</h2>
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 font-semibold">€</span>
            <input
              v-model.number="pastaPriceEdit"
              type="number"
              step="0.01"
              min="0"
              class="w-full h-12 rounded-xl bg-white border border-gray-200 pl-8 pr-4 text-[14px] text-app-black focus:outline-none focus:border-primary"
            />
          </div>
          <button
            @click="savePastaPrice"
            class="h-12 px-5 rounded-xl bg-primary text-white font-semibold text-[14px] flex items-center gap-2 active:scale-[0.98] transition-transform shrink-0"
          >
            <PhFloppyDisk :size="18" weight="fill" />
            Save
          </button>
        </div>
        <p v-if="priceSaved" class="text-[12px] text-green-600 mt-2 flex items-center gap-1">
          <PhCheck :size="14" weight="bold" />
          Saved
        </p>
      </div>

      <!-- ── Transaction History ────────────────────────────────────────── -->
      <div>
        <h2 class="text-[20px] font-semibold text-app-black mb-3">Transaction History</h2>
        <div v-if="loadingTransactions" class="space-y-2">
          <div v-for="i in 4" :key="i" class="h-16 bg-white rounded-2xl border border-gray-100 p-4">
            <div class="h-3 w-32 bg-gray-100 rounded-full animate-pulse mb-2" />
            <div class="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div v-else-if="transactions.length === 0" class="text-center text-[14px] text-gray-400 py-6">
          No transactions yet
        </div>
        <div v-else class="space-y-1">

          <!-- Slider mode -->
          <template v-if="!transactionsExpanded">
            <SliderList :items="transactions" :visible-count="5" :item-height="72">
              <template #item="{ item: tx }">
                <TransactionRow :tx="tx" :compact="true" />
              </template>
            </SliderList>
            <button
              v-if="transactions.length > 5"
              class="w-full flex items-center justify-center gap-1 mt-2 text-[13px] text-gray-400 font-medium active:text-app-black transition-colors active:scale-[0.98]"
              @click="transactionsExpanded = true"
            >
              Show all ({{ transactions.length }})
            </button>
          </template>

          <!-- Expanded mode -->
          <template v-else>
            <div class="space-y-2">
              <div
                v-for="tx in transactions"
                :key="tx.id"
              >
                <TransactionRow :tx="tx" />
              </div>
            </div>
            <button
              class="w-full flex items-center justify-center gap-1 mt-3 text-[13px] text-gray-400 font-medium active:text-app-black transition-colors active:scale-[0.98]"
              @click="transactionsExpanded = false"
            >
              Show less
            </button>
          </template>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
