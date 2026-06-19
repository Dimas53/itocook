<template>
  <div class="flex flex-col min-h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-5">
      <button @click="router.back()" class="w-10 h-10 flex items-center justify-center">
        <PhCaretLeft class="w-6 h-6 text-app-black" />
      </button>
      <h1 class="text-[20px] font-semibold text-app-black">Profile</h1>
      <button class="w-10 h-10 flex items-center justify-center" @click="handleLogout">
        <PhSignOut class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <!-- Avatar + name -->
    <div class="px-5 pb-6">
      <div class="flex items-center gap-4">
        <div class="relative w-[80px] h-[80px] cursor-pointer shrink-0" @click="triggerAvatarUpload">
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            class="w-full h-full rounded-full object-cover ring-2 ring-primary"
            alt="Profile photo"
          />
          <div v-else class="w-full h-full ring-2 ring-primary rounded-full overflow-hidden">
            <AvatarPlaceholder />
          </div>

          <div class="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <PhCamera :size="14" weight="fill" class="text-white" />
          </div>

          <div v-if="avatarUploading" class="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onAvatarSelected"
        />

        <div class="flex-1">
          <p class="text-[18px] font-medium text-app-black">{{ displayName }}</p>
          <p class="text-[14px] text-gray-500 mt-0.5">{{ user?.email }}</p>
        </div>
      </div>
    </div>

    <!-- Preferences -->
    <div class="px-5 pb-5">
      <div
        class="flex items-center justify-between bg-primary-pale rounded-2xl px-5 py-4 cursor-pointer active:scale-[0.98] transition-transform"
        @click="showPreferences = true"
      >
        <div>
          <p class="text-[16px] font-medium text-app-black">Preferences</p>
          <p
            v-if="user?.department"
            class="text-[12px] text-primary mt-0.5"
          >
            {{ user.department }}
          </p>
          <p
            v-else
            class="text-[12px] text-gray-500 mt-0.5"
          >
            Goals, food preferences and more
          </p>
        </div>
        <PhCaretRight class="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <!-- Balance -->
    <div class="bg-white rounded-2xl px-4 py-4 mx-5 mb-4 shadow-sm">
      <div v-if="loadingBalance" class="space-y-2">
        <div class="h-3 w-20 bg-gray-100 rounded-full animate-pulse" />
        <div class="h-8 w-24 bg-gray-100 rounded-full animate-pulse mt-2" />
      </div>
      <template v-else-if="balance !== null">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[12px] text-gray-500">My Balance</p>
            <p
              class="text-[28px] font-bold"
              :class="balance >= 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ balance < 0 ? '-' : '' }}€{{ Math.abs(balance).toFixed(2) }}
            </p>
          </div>
          <span
            v-if="balance < 5"
            class="bg-red-50 text-red-400 text-[11px] mt-auto font-medium rounded-full px-3 py-1"
          >
            Limit: -€{{ Math.abs(MIN_BALANCE).toFixed(0) }}
          </span>
        </div>

        <!-- Transactions -->
        <div class="mt-4">
          <button
            class="flex items-center gap-2"
            @click="showTransactions = !showTransactions"
          >
            <span class="text-[14px] font-semibold text-app-black">Transactions</span>
            <PhCaretDown
              class="w-4 h-4 text-app-black/50 transition-transform"
              :class="showTransactions ? 'rotate-180' : ''"
              weight="bold"
            />
          </button>

          <template v-if="showTransactions">
            <div v-if="loadingTransactions" class="space-y-2 mt-3">
              <div v-for="i in 3" :key="i" class="h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>
            <div v-else-if="transactions.length === 0" class="text-[13px] text-gray-400 text-center py-3">
              No transactions yet
            </div>
            <div v-else class="mt-3">
              <SliderList :items="transactions" :visibleCount="4" :itemHeight="48" :itemGap="0">
                <template #item="{ item: tx }">
                  <div class="flex justify-between items-start h-full px-0.5 py-2 border-b border-gray-100">
                    <div class="flex-1 min-w-0 mr-2">
                      <p class="text-[13px] text-app-black truncate">{{ tx.description }}</p>
                      <p class="text-[11px] text-gray-400 mt-0.5">{{ formatTxDate(tx.date) }}</p>
                    </div>
                    <span
                      class="text-[13px] font-semibold shrink-0"
                      :class="tx.amount >= 0 ? 'text-green-600' : 'text-red-500'"
                    >
                      {{ tx.amount >= 0 ? '+' : '-' }}€{{ Math.abs(tx.amount).toFixed(2) }}
                    </span>
                  </div>
                </template>
              </SliderList>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- Tabs -->
    <div class="px-5 pb-5">
      <div class="flex gap-2 bg-white rounded-full p-1.5 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="[
            'px-4 h-9 rounded-full text-[14px] font-medium transition-colors',
            activeTab === tab
              ? 'bg-primary text-white'
              : 'text-gray-500'
          ]"
          @click="switchTab(tab)"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- Tab content -->
    <div class="px-5 flex-1 overflow-y-auto scrollbar-hide pb-6">

      <!-- My List -->
      <template v-if="activeTab === 'My List'">
        <div v-if="loadingOrders" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-20 rounded-xl animate-pulse" :class="i % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'" />
        </div>
        <div v-else-if="myOrders.length === 0" class="text-center py-8 text-gray-400 text-[14px]">
          You haven't joined any dishes yet
        </div>
        <div v-else>
          <SliderList :items="myOrders" :visibleCount="4" :itemHeight="88" :itemGap="8">
            <template #item="{ item: order, index: i }">
              <div
                class="rounded-xl p-4 flex items-center justify-between h-full"
                :class="order.isCook ? 'bg-primary-light/80' : getColor(i)"
              >
                <div class="flex-1 min-w-0 mr-3">
                  <p class="text-[14px] font-semibold text-app-black truncate">{{ order.dish_name }}</p>
                  <p class="text-[12px] text-app-black/60 mt-0.5">
                    {{ order.dateLabel }} &middot; by {{ order.cookName }}
                  </p>
                  <p v-if="order.isCook" class="text-[12px] font-bold text-primary mt-0.5">
                    You are the cook
                  </p>
                  <p class="text-[12px] text-app-black/40 mt-0.5">Price: —</p>
                </div>
                <button
                  class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 active:scale-[0.95] transition-transform"
                  @click="promptLeaveQueue(order)"
                >
                  <PhX class="w-4 h-4 text-red-500" weight="bold" />
                </button>
              </div>
            </template>
          </SliderList>
        </div>
      </template>

      <!-- My Recipes -->
      <template v-if="activeTab === 'My Recipes'">
        <div v-if="loadingRecipes" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-20 rounded-xl animate-pulse" :class="i % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200'" />
        </div>
        <div v-else-if="myRecipes.length === 0" class="text-center py-8 text-gray-400 text-[14px]">
          You haven't created any recipes yet
        </div>
        <div v-else>
          <SliderList :items="myRecipes" :visibleCount="4" :itemHeight="76" :itemGap="8">
            <template #item="{ item: recipe, index: i }">
              <div
                class="rounded-xl p-4 flex items-center justify-between h-full cursor-pointer active:scale-[0.98] transition-transform"
                :class="getColor(i)"
                @click="router.push(`/recipe/${recipe.id}`)"
              >
                <div class="flex-1 min-w-0 mr-3">
                  <p class="text-[14px] font-semibold text-app-black truncate">{{ recipe.dish_name }}</p>
                  <p class="text-[12px] text-app-black/60 mt-0.5">
                    {{ formatDateLabel(recipe.date_created) }} · {{ recipe.category || 'Uncategorized' }}
                  </p>
                </div>
                <PhCaretRight class="w-4 h-4 text-app-black/40 shrink-0" />
              </div>
            </template>
          </SliderList>
        </div>
      </template>

    </div>

    <!-- Preferences bottom sheet -->
    <div
      v-if="showPreferences"
      class="absolute inset-0 z-50 flex flex-col justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="showPreferences = false" />
      <div class="relative bg-white rounded-t-3xl pb-8 px-5 pt-5 h-2/4 max-h-[70%] overflow-y-auto">
        <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 class="text-[18px] font-semibold text-app-black mb-4">Preferences</h3>

        <p class="text-[11px] text-gray-400 mb-1">Department</p>
        <select
          :value="user?.department || ''"
          class="bg-primary-pale text-app-black text-[13px] font-medium rounded-xl px-3 py-2 pr-8 border-none outline-none w-full cursor-pointer"
          @change="updateDepartment(($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>— Abteilung wählen —</option>
          <option value="Buchhaltung">Buchhaltung</option>
          <option value="Vertrieb">Vertrieb</option>
          <option value="IT-Security">IT-Security</option>
          <option value="Infrastruktur">Infrastruktur</option>
          <option value="Entwicklung">Entwicklung</option>
          <option value="HR">HR</option>
          <option value="MARKET">MARKET</option>
          <option value="CONTR">CONTR</option>
        </select>

        <button
          class="bg-primary-pale text-primary h-12 rounded-2xl w-full text-[14px] font-semibold mt-6 active:scale-[0.98] transition-transform"
          @click="showPreferences = false"
        >
          Done
        </button>
      </div>
    </div>

    <!-- Confirm leave overlay -->
    <div
      v-if="showConfirmLeave"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
      @click.self="showConfirmLeave = false"
    >
      <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
        <h3 class="text-[16px] font-bold text-app-black mb-2">Leave queue?</h3>
        <p class="text-[13px] text-app-black/70 leading-relaxed">
          Are you sure you want to leave this dish?
        </p>
        <p class="text-[11px] text-app-black/50 mt-2 leading-relaxed">
          {{ confirmLeaveText }}
        </p>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 h-11 rounded-full border border-gray-200 text-app-black font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="showConfirmLeave = false"
          >
            Cancel
          </button>
          <button
            class="flex-1 h-11 rounded-full bg-red-500 text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="confirmLeave"
          >
            Leave
          </button>
        </div>
      </div>
    </div>

    <div class="h-20" />
  </div>
</template>

<script setup lang="ts">
/**
 * Profile page — user info, balance, my recipes, my orders, leave dish.
 * Touches: `directus_users`, `balances`, `recipes`, `orders`, `cook_queue`.
 */
import { PhCaretLeft, PhSignOut, PhCaretRight, PhX, PhCaretDown, PhCamera } from '@phosphor-icons/vue'
import { onMounted } from 'vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { user, logout, fetchUser } = useAuth()
const { request, uploadFile } = useDirectus()
const { MIN_BALANCE } = useBalanceCheck()
const config = useRuntimeConfig()
const directusUrl = config.public.directusUrl

const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)

const avatarSrc = computed(() => {
  if (user.value?.avatar) {
    return `${directusUrl}/assets/${user.value.avatar}`
  }
  return null
})

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function onAvatarSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  avatarUploading.value = true
  try {
    const resized = await resizeImage(file, 400, 0.85)
    const uploaded = await uploadFile(resized)
    await $fetch('/api/users/update-me', { method: 'PATCH', body: { avatar: uploaded.id } })
    await fetchUser()
  } catch (e) {
    console.error('Avatar upload failed:', e)
  } finally {
    avatarUploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

async function resizeImage(file: File, maxPx: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(new File([blob!], 'avatar.jpg', { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      )
    }
    img.src = url
  })
}

interface MyOrder {
  id: string
  dish_name: string
  date: string
  dateLabel: string
  cookName: string
  isCook: boolean
  cookQueueId: string
  status: string
}

interface MyRecipe {
  id: string
  dish_name: string
  category: string | null
  date_created: string
}

const activeTab = ref('My List')
const tabs = ['My List', 'My Recipes']

const myOrders = ref<MyOrder[]>([])
const myRecipes = ref<MyRecipe[]>([])
const loadingOrders = ref(true)
const loadingRecipes = ref(true)
const showPreferences = ref(false)
const showConfirmLeave = ref(false)
const leavingOrderId = ref<string | null>(null)
const confirmLeaveText = ref('')

// ── Balance & Transactions ──────────────────────────────────────────────────
const balance = ref<number | null>(null)
const transactions = ref<TransactionItem[]>([])
const loadingBalance = ref(true)
const loadingTransactions = ref(true)
const showTransactions = ref(false)

interface TransactionItem {
  id: string
  amount: number
  description: string
  date: string
}

async function fetchBalance() {
  loadingBalance.value = true
  try {
    const items = await request<any[]>('get',
      `/items/balances?filter[user][_eq]=${user.value?.id}&limit=1`
    )
    balance.value = items.length > 0 ? Number(items[0]!.amount) : null
  } catch {
    balance.value = null
  }
  loadingBalance.value = false
}

async function fetchTransactions() {
  loadingTransactions.value = true
  try {
    const items = await request<any[]>('get',
      `/items/transactions?filter[user][_eq]=${user.value?.id}&sort[]=-date&limit=50`
    )
    transactions.value = (items ?? []).map((t: any) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description || '',
      date: t.date,
    }))
  } catch {
    transactions.value = []
  }
  loadingTransactions.value = false
}

function formatTxDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday}, ${month} ${d.getDate()}`
}

const PASTEL_COLORS = ['bg-yellow-pastel', 'bg-green-pastel', 'bg-primary-pale']

const displayName = computed(() => {
  if (!user.value) return ''
  const full = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim()
  return full || user.value.email
})


function getColor(index: number): string {
  return PASTEL_COLORS[index % PASTEL_COLORS.length]!
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return ''
  const d = dateStr.includes('T') ? new Date(dateStr) : parseISODate(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

async function switchTab(tab: string) {
  activeTab.value = tab
  if (tab === 'My List') {
    await fetchMyOrders()
  }
  if (tab === 'My Recipes') {
    await fetchMyRecipes()
  }
}

async function fetchMyOrders() {
  loadingOrders.value = true
  try {
    const orders = await request<any[]>('get',
      `/items/orders?filter[user][_eq]=${user.value?.id}&filter[status][_eq]=confirmed&filter[cook_queue][_nnull]=true&fields=*,cook_queue.id,cook_queue.date,cook_queue.dish_name,cook_queue.status,cook_queue.cook.id,cook_queue.cook.first_name,cook_queue.cook.last_name&sort=-cook_queue.date&limit=50`
    )
    myOrders.value = orders
      .filter((o) => o.cook_queue != null)
      .map((o) => {
        const cq = o.cook_queue
        let cookName = ''
        let isCook = false
        if (cq && cq.cook && typeof cq.cook === 'object') {
          cookName = formatUserName(cq.cook)
          isCook = cq.cook.id === user.value?.id
        }
        return {
          id: o.id,
          dish_name: cq?.dish_name || 'Unknown dish',
          date: cq?.date || '',
          dateLabel: formatDateLabel(cq?.date),
          cookName,
          isCook,
          cookQueueId: cq?.id || '',
          status: cq?.status || '',
        }
      })
  } catch {
    // ignore
  }
  loadingOrders.value = false
}

async function fetchMyRecipes() {
  loadingRecipes.value = true
  try {
    const recipes = await request<MyRecipe[]>('get',
      `/items/recipes?filter[user_created][_eq]=${user.value?.id}&sort=-date_created&fields=id,dish_name,category,date_created&limit=50`
    )
    myRecipes.value = recipes
  } catch {
    // ignore
  }
  loadingRecipes.value = false
}

function promptLeaveQueue(order: MyOrder) {
  if (!order.cookQueueId) {
    removeOrphanedOrder(order.id)
    return
  }
  const cookingDate = parseISODate(order.date)
  const now = new Date()
  const hoursUntil = (cookingDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const withinPenalty = hoursUntil >= 0 && hoursUntil < 10
  confirmLeaveText.value = withinPenalty
    ? 'You are leaving less than 10 hours before cooking. The cost of this dish will still be counted on your balance.'
    : 'You can leave more than 10 hours before cooking. The cost will not be counted on your balance.'
  leavingOrderId.value = order.cookQueueId
  showConfirmLeave.value = true
}

async function removeOrphanedOrder(orderId: string) {
  try {
    await request('delete', `/items/orders/${orderId}`)
    await fetchMyOrders()
  } catch (e) {
    console.error('Failed to remove orphaned order:', e)
  }
}

async function confirmLeave() {
  if (!leavingOrderId.value || !user.value?.id) return
  try {
    const orders = await request<any[]>('get',
      `/items/orders?filter[cook_queue][_eq]=${leavingOrderId.value}&filter[user][_eq]=${user.value.id}&filter[status][_eq]=confirmed`
    )
    for (const o of orders) {
      await request('delete', `/items/orders/${o.id}`)
    }
    await fetchMyOrders()
  } catch (e) {
    console.error('Failed to leave queue:', e)
  }
  showConfirmLeave.value = false
  leavingOrderId.value = null
}

async function updateDepartment(value: string) {
  try {
    await $fetch('/api/users/update-me', { method: 'PATCH', body: { department: value || null } })
    if (user.value) {
      user.value.department = value || null
    }
  } catch (e) {
    console.error('Failed to update department:', e)
  }
}

async function handleLogout() {
  logout()
  await navigateTo('/onboarding')
}

onMounted(() => {
  fetchMyOrders()
  fetchBalance()
  fetchTransactions()
})
</script>
