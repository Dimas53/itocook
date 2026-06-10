<template>
  <div class="flex flex-col min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Cook Panel</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">
          {{ pageTitle }}
        </h1>
      </div>
      <button class="w-10 h-10 flex items-center justify-center" @click="router.push('/')">
        <PhX class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-[100px] space-y-4">

      <!-- ═══════ ASSIGN STATE ═══════ -->
      <template v-if="state === 'assign'">
        <div class="rounded-2xl bg-primary-light/50 p-6 text-center space-y-4">
          <PhChefHat class="w-12 h-12 text-primary mx-auto" weight="fill" />
          <div>
            <p class="text-[18px] font-bold text-app-black">No cook assigned</p>
            <p class="text-[14px] text-gray-500 mt-1">{{ formattedDate }}</p>
          </div>
          <button
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            :disabled="saving"
            @click="assignAsCook"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
            <PhChefHat v-else class="w-5 h-5" weight="fill" />
            {{ saving ? 'Assigning...' : "I'm cooking today!" }}
          </button>
        </div>
      </template>

      <!-- ═══════ DISH STATE ═══════ -->
      <template v-if="state === 'dish'">
        <div class="rounded-2xl bg-primary-light/50 p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <PhCheck class="w-5 h-5 text-white" weight="bold" />
            </div>
            <div>
              <p class="text-[14px] font-semibold text-app-black">You're the cook!</p>
              <p class="text-[12px] text-gray-500">{{ formattedDate }}</p>
            </div>
          </div>

          <div>
            <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">
              What are you cooking?
            </label>
            <input
              v-model="dishName"
              type="text"
              placeholder="Enter dish name..."
              class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
              @keyup.enter="saveDish"
            />
          </div>

          <div class="space-y-2">
            <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">
              Or pick from history
            </p>
            <div
              v-for="item in pastDishes"
              :key="item.id"
              class="rounded-xl bg-white/70 px-4 py-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              @click="selectPastDish(item)"
            >
              <p class="text-[14px] font-medium text-app-black">{{ item.dish_name }}</p>
              <PhClockCounterClockwise class="w-4 h-4 text-gray-400" />
            </div>
            <div v-if="pastDishes.length === 0" class="text-[13px] text-gray-400 text-center py-3">
              No past dishes yet
            </div>
          </div>

          <button
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] active:scale-[0.98] transition-transform disabled:opacity-50"
            :disabled="!dishName.trim() || saving"
            @click="saveDish"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin mx-auto" />
            <span v-else>Start Cooking</span>
          </button>
        </div>
      </template>

      <!-- ═══════ COOKING STATE ═══════ -->
      <template v-if="state === 'cooking'">
        <div class="rounded-2xl bg-primary-light/50 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-pastel flex items-center justify-center">
                <PhCookingPot class="w-5 h-5 text-green-700" weight="fill" />
              </div>
              <div>
                <p class="text-[14px] font-semibold text-app-black">Cooking in progress</p>
                <p class="text-[12px] text-gray-500">{{ formattedDate }}</p>
              </div>
            </div>
            <button
              class="text-[12px] text-primary font-semibold underline active:scale-[0.98]"
              @click="editDish"
            >
              Edit
            </button>
          </div>

          <div class="rounded-xl bg-white p-4">
            <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Today's Dish</p>
            <p class="text-[20px] font-bold text-app-black mt-1">{{ cookEntry?.dish_name }}</p>
          </div>

          <div>
            <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2">
              Participants ({{ participants.length }})
            </p>
            <div v-if="participants.length === 0" class="rounded-xl bg-white/70 p-4 text-center">
              <PhUsers class="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p class="text-[13px] text-gray-400">No one has joined yet</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="p in participants"
                :key="p.id"
                class="rounded-xl bg-white/70 px-4 py-3 flex items-center gap-3"
              >
                <div class="w-8 h-8 rounded-full bg-primary-pale flex items-center justify-center">
                  <span class="text-[12px] font-semibold text-primary">{{ p.name.charAt(0) }}</span>
                </div>
                <p class="text-[14px] font-medium text-app-black">{{ p.name }}</p>
              </div>
            </div>
          </div>

          <button
            class="w-full h-14 rounded-full bg-green-pastel text-app-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            :disabled="saving"
            @click="markReady"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
            <template v-else>
              <PhCheckCircle class="w-5 h-5" weight="fill" />
              Lunch is ready!
            </template>
          </button>
        </div>
      </template>

      <!-- ═══════ RECEIPT STATE ═══════ -->
      <template v-if="state === 'receipt'">
        <div class="rounded-2xl bg-primary-light/50 p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <PhReceipt class="w-5 h-5 text-app-black" weight="fill" />
            </div>
            <div>
              <p class="text-[14px] font-semibold text-app-black">Lunch is served!</p>
              <p class="text-[12px] text-gray-500">Enter the receipt to split the bill</p>
            </div>
          </div>

          <div v-if="participants.length === 0" class="rounded-xl bg-white/70 p-4 text-center">
            <p class="text-[13px] text-gray-500">No participants to split with</p>
          </div>

          <template v-if="participants.length > 0">
            <div>
              <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">
                Total receipt amount (€)
              </label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 font-semibold">€</span>
                <input
                  v-model="receiptAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="w-full h-12 rounded-xl bg-white border border-gray-200 pl-8 pr-4 text-[16px] font-semibold text-app-black placeholder:text-gray-300 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div class="rounded-xl bg-white p-4 space-y-2">
              <div class="flex justify-between text-[14px]">
                <span class="text-gray-500">Participants</span>
                <span class="font-semibold text-app-black">{{ participants.length }}</span>
              </div>
              <div class="flex justify-between text-[14px]">
                <span class="text-gray-500">Share per person</span>
                <span class="font-semibold text-app-black">
                  €{{ sharePerPerson }}
                </span>
              </div>
              <hr class="border-gray-100" />
              <div class="flex justify-between text-[14px]">
                <span class="text-gray-500">Total</span>
                <span class="font-bold text-app-black text-[16px]">€{{ formattedReceipt }}</span>
              </div>
            </div>

            <div class="rounded-xl bg-yellow-pastel p-4">
              <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Deduction preview</p>
              <div v-for="p in participants" :key="p.id" class="flex justify-between text-[14px] mt-2">
                <span class="text-app-black">{{ p.name }}</span>
                <span class="font-medium text-app-black">−€{{ sharePerPerson }}</span>
              </div>
            </div>

            <button
              class="w-full h-14 rounded-full bg-app-black text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              :disabled="!receiptAmount || parseFloat(receiptAmount) <= 0 || deducting"
              @click="confirmDeduction"
            >
              <PhSpinner v-if="deducting" class="w-5 h-5 animate-spin" />
              <template v-else>
                <PhCreditCard class="w-5 h-5" weight="fill" />
                Confirm Deduction
              </template>
            </button>
          </template>
        </div>
      </template>

      <!-- ═══════ DONE STATE ═══════ -->
      <template v-if="state === 'done'">
        <div class="rounded-2xl bg-green-pastel p-6 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center">
            <PhCheckCircle class="w-8 h-8 text-green-600" weight="fill" />
          </div>
          <div>
            <p class="text-[18px] font-bold text-app-black">All done!</p>
            <p class="text-[14px] text-gray-500 mt-1">{{ cookEntry?.dish_name }} — {{ formattedDate }}</p>
          </div>
          <div class="rounded-xl bg-white/70 p-4">
            <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Receipt total</p>
            <p class="text-[24px] font-bold text-app-black mt-1">€{{ formattedReceipt }}</p>
            <p class="text-[13px] text-gray-500">{{ participants.length }} participants · €{{ sharePerPerson }} each</p>
          </div>
          <button
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] active:scale-[0.98] transition-transform"
            @click="router.push('/')"
          >
            Back to Home
          </button>
        </div>
      </template>

      <!-- ═══════ LOADING ═══════ -->
      <div v-if="loading" class="space-y-4">
        <div class="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div class="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div class="h-14 bg-gray-100 rounded-full animate-pulse" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhX,
  PhChefHat,
  PhCheck,
  PhSpinner,
  PhCookingPot,
  PhUsers,
  PhCheckCircle,
  PhReceipt,
  PhCreditCard,
  PhClockCounterClockwise,
} from '@phosphor-icons/vue'

definePageMeta({
  layout: 'app',
  middleware: 'cook',
  darkStatus: false,
})

const { request } = useDirectus()
const { user } = useAuth()
const router = useRouter()
const route = useRoute()

// ── Types ──
interface CookQueueEntry {
  id: string
  date: string
  dish_name: string | null
  status: string | null
  cook: string | { id: string; first_name: string; last_name: string }
}

interface OrderEntry {
  id: string
  user: {
    id: string
    first_name: string
    last_name: string
  }
  status: string
}

interface BalanceEntry {
  id: string
  user: string
  amount: string
}

interface Participant {
  id: string
  name: string
}

interface HistoryDish {
  id: string
  dish_name: string
}

// ── Date helpers ──
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const pageDateStr = computed(() => {
  return (route.query.date as string) || formatDateISO(new Date())
})

const formattedDate = computed(() => {
  const d = new Date(pageDateStr.value + 'T12:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
})

// ── State ──
const loading = ref(true)
const saving = ref(false)
const deducting = ref(false)
const cookEntry = ref<CookQueueEntry | null>(null)
const dishName = ref('')
const receiptAmount = ref<string>('')
const participants = ref<Participant[]>([])
const pastDishes = ref<HistoryDish[]>([])
const deductionResult = ref(false)

// ── Computed state machine ──
const state = computed(() => {
  if (loading.value) return 'loading'
  if (!cookEntry.value) return 'assign'
  if (!cookEntry.value.dish_name) return 'dish'
  if (cookEntry.value.status === 'scheduled' || cookEntry.value.status === 'cooking') return 'cooking'
  if (cookEntry.value.status === 'ready' && !deductionResult.value) return 'receipt'
  return 'done'
})

const pageTitle = computed(() => {
  switch (state.value) {
    case 'assign': return 'Become a Cook'
    case 'dish': return 'What\u2019s Cooking?'
    case 'cooking': return 'Cooking in Progress'
    case 'receipt': return 'Split the Bill'
    case 'done': return 'Completed'
    default: return 'Cook Panel'
  }
})

const formattedReceipt = computed(() => {
  const val = parseFloat(receiptAmount.value)
  return isNaN(val) ? '0.00' : val.toFixed(2)
})

const sharePerPerson = computed(() => {
  const val = parseFloat(receiptAmount.value)
  if (isNaN(val) || participants.value.length === 0) return '0.00'
  return (val / participants.value.length).toFixed(2)
})

// ── Fetch today's cook entry ──
async function fetchTodayEntry() {
  loading.value = true
  try {
    const items = await request<CookQueueEntry[]>('get',
      `/items/cook_queue?filter[date][_eq]=${pageDateStr.value}&filter[cook][_eq]=${user.value?.id}&filter[status][_nin]=cancelled&limit=1&fields=*,cook.id,cook.first_name,cook.last_name`
    )
    const existing = items[0]
    if (existing) {
      cookEntry.value = existing
      if (existing.dish_name) {
        dishName.value = existing.dish_name
      }
    }
  } catch {
    // Directus may not be available
  }
  loading.value = false
}

// ── Fetch past dishes for history selection ──
async function fetchPastDishes() {
  try {
    const items = await request<CookQueueEntry[]>('get',
      `/items/cook_queue?filter[date][_lt]=${pageDateStr.value}&filter[dish_name][_nnull]=&sort=-date&limit=10&fields=id,dish_name`
    )
    const seen = new Set<string>()
    pastDishes.value = items
      .filter((i) => {
        if (!i.dish_name || seen.has(i.dish_name)) return false
        seen.add(i.dish_name)
        return true
      })
      .map((i) => ({ id: i.id, dish_name: i.dish_name! }))
  } catch {
    // ignore
  }
}

// ── Fetch participants (confirmed orders) ──
async function fetchParticipants() {
  if (!cookEntry.value) return
  try {
    const orders = await request<OrderEntry[]>('get',
      `/items/orders?filter[cook_queue][_eq]=${cookEntry.value.id}&filter[status][_eq]=confirmed&fields=*,user.id,user.first_name,user.last_name`
    )
    participants.value = orders.map((o) => ({
      id: o.user.id,
      name: [o.user.first_name, o.user.last_name].filter(Boolean).join(' ') || 'Unknown',
    }))
  } catch {
    // ignore
  }
}

// ── Actions ──

async function assignAsCook() {
  saving.value = true
  try {
    const newEntry = await request<CookQueueEntry>('post', '/items/cook_queue', {
      date: pageDateStr.value,
      cook: user.value?.id,
      status: 'scheduled',
    })
    cookEntry.value = newEntry
    await fetchPastDishes()
  } catch (e) {
    console.error('Failed to assign as cook:', e)
  }
  saving.value = false
}

async function saveDish() {
  if (!cookEntry.value || !dishName.value.trim()) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      dish_name: dishName.value.trim(),
      status: 'cooking',
    })
    cookEntry.value.dish_name = dishName.value.trim()
    cookEntry.value.status = 'cooking'
    await fetchParticipants()
  } catch (e) {
    console.error('Failed to save dish:', e)
  }
  saving.value = false
}

function selectPastDish(item: HistoryDish) {
  dishName.value = item.dish_name
}

function editDish() {
  if (!cookEntry.value) return
  cookEntry.value.dish_name = null
}

async function markReady() {
  if (!cookEntry.value) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'ready',
    })
    cookEntry.value.status = 'ready'
    await fetchParticipants()
  } catch (e) {
    console.error('Failed to mark ready:', e)
  }
  saving.value = false
}

async function confirmDeduction() {
  if (!cookEntry.value || !receiptAmount.value || participants.value.length === 0) return
  deducting.value = true
  const total = parseFloat(receiptAmount.value)
  const share = total / participants.value.length

  try {
    for (const p of participants.value) {
      // Create transaction
      await request('post', '/items/transactions', {
        user: p.id,
        amount: -share,
        type: 'debit',
        description: `Lunch ${pageDateStr.value}: ${cookEntry.value.dish_name || 'Office lunch'}`,
        date: new Date().toISOString(),
      })

      // Update or create balance
      const balances = await request<BalanceEntry[]>('get',
        `/items/balances?filter[user][_eq]=${p.id}&limit=1`
      )
      const existingBalance = balances[0]
      if (existingBalance) {
        const currentAmount = parseFloat(existingBalance.amount)
        await request('PATCH', `/items/balances/${existingBalance.id}`, {
          amount: currentAmount - share,
        })
      } else {
        await request('post', '/items/balances', {
          user: p.id,
          amount: -share,
        })
      }
    }

    // Mark cook_queue as completed
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'completed',
    })
    cookEntry.value.status = 'completed'
    deductionResult.value = true
  } catch (e) {
    console.error('Failed to process deduction:', e)
  }
  deducting.value = false
}

// ── Init ──
onMounted(async () => {
  await fetchTodayEntry()
  if (cookEntry.value && !cookEntry.value.dish_name) {
    await fetchPastDishes()
  }
  if (cookEntry.value && cookEntry.value.dish_name) {
    await fetchParticipants()
  }
})
</script>
