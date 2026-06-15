<template>
  <div class="flex flex-col h-full relative">

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <PhSpinner class="w-8 h-8 text-primary animate-spin" />
    </div>

    <!-- Error -->
    <div v-else-if="!recipe" class="flex-1 flex flex-col items-center justify-center px-5 text-center">
      <p class="text-[16px] font-semibold text-app-black mb-2">Recipe not found</p>
      <button class="text-[14px] text-primary underline" @click="router.back()">Go back</button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Photo -- fixed top -->
      <div class="bg-primary-light h-[320px] relative shrink-0">
        <div class="absolute top-10 inset-0 p-2 flex items-center justify-center">
          <img
              :src="recipeImage.src"
              :alt="recipe.dish_name"
              :class="[
                recipeImage.isUploaded
                  ? 'w-56 h-56 object-cover rounded-full border-[3px]'
                  : 'w-full h-full object-contain'
              ]"  />
        </div>
        <button
          class="absolute left-5 top-12 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-[0.98]"
          @click="router.back()"
        >
          <PhCaretLeft class="w-5 h-5 text-app-black" weight="bold" />
        </button>
        <button
          class="absolute right-5 top-12 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-[0.98]"
          @click="router.push('/kitchen')"
        >
          <PhX class="w-5 h-5 text-app-black" weight="bold" />
        </button>
        <button
          @click="toggleLike"
          class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
        >
          <PhHeart :size="20" :weight="isLiked ? 'fill' : 'regular'" :class="isLiked ? 'text-red-500' : 'text-gray-400'" />
        </button>
      </div>

      <!-- White card -- scrollable middle -->
      <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div class="rounded-t-3xl -mt-4 bg-white px-5 pt-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <!-- Title + category -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1 min-w-0 mr-3">
              <h1 class="text-[22px] font-bold text-app-black break-words">{{ recipe.dish_name }}</h1>
              <span v-if="recipe.category" class="inline-block mt-1.5 text-[11px] font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded-full capitalize">
                {{ recipe.category }}
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <PhHeart class="w-4 h-4" :class="isLiked ? 'text-red-500' : 'text-gray-400'" :weight="isLiked ? 'fill' : 'regular'" />
              <span class="text-[14px] font-semibold text-app-black">{{ likeCount }}</span>
            </div>
          </div>

          <!-- Cook row -->
          <div v-if="recipe.cook_name" class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-2.5">
              <img
                :src="`https://i.pravatar.cc/200?u=${recipe.cook_name}`"
                :alt="recipe.cook_name"
                class="w-8 h-8 rounded-full"
              />
              <div>
                <p class="text-[14px] font-semibold text-app-black leading-tight">{{ recipe.cook_name }}</p>
                <p class="text-[11px] text-app-black/50">Chef</p>
              </div>
            </div>
            <div class="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
              <PhChefHat class="w-5 h-5 text-primary" weight="fill" />
            </div>
          </div>

          <!-- Description -->
          <div v-if="recipe.description" class="mb-5">
            <h3 class="text-[14px] font-semibold text-app-black mb-2">Description</h3>
            <p class="text-[14px] text-app-black/70 leading-relaxed whitespace-pre-line">
              {{ recipe.description }}
            </p>
          </div>

          <!-- Ingredients -->
          <div v-if="recipe.ingredients && recipe.ingredients.length > 0" class="mb-5">
            <div class="flex items-center justify-between w-full mb-2">
              <button
                class="flex items-center gap-2"
                @click="showIngredients = !showIngredients"
              >
                <h3 class="text-[14px] font-semibold text-app-black">Ingredients ({{ recipe.ingredients.length }})</h3>
                <PhCaretDown
                  class="w-4 h-4 text-app-black/50 transition-transform"
                  :class="showIngredients ? 'rotate-180' : ''"
                  weight="bold"
                />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-full active:scale-[0.98] transition-transform"
                @click="shareShoppingList"
                title="Share shopping list"
              >
                <PhShareNetwork class="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <ul v-if="showIngredients" class="space-y-2">
              <li v-for="(ing, i) in recipe.ingredients" :key="i" class="flex items-center gap-3 text-[14px] text-app-black/70">
                <span class="text-lg w-6 text-center shrink-0">{{ getIngredientIcon(ing.name) }}</span>
                <span>{{ ing.name }}</span>
                <span v-if="ing.amount || ing.unit" class="font-medium text-app-black shrink-0 ml-auto">
                  {{ ing.amount }}{{ ing.unit ? ' ' + ing.unit : '' }}
                </span>

              </li>
            </ul>
          </div>

          <!-- Steps -->
          <div v-if="recipe.steps && recipe.steps.length > 0" class="mb-6">
            <button
              class="flex items-center justify-between w-full mb-3"
              @click="showSteps = !showSteps"
            >
              <h3 class="text-[14px] font-semibold text-app-black">Steps ({{ recipe.steps.length }})</h3>
              <PhCaretDown
                class="w-4 h-4 text-app-black/50 transition-transform"
                :class="showSteps ? 'rotate-180' : ''"
                weight="bold"
              />
            </button>
            <div v-if="showSteps" class="space-y-4">
              <div v-for="(step, i) in recipe.steps" :key="i" class="flex gap-3">
                <div class="w-7 h-7 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                  <span class="text-[11px] font-bold text-primary">{{ step.step || i + 1 }}</span>
                </div>
                <p class="text-[14px] text-app-black/70 leading-relaxed pt-0.5">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom controls -->
      <div class="shrink-0 bg-white px-5 py-4 border-t border-gray-100">
        <template v-if="queueEntry && statusConfig">
          <div class="space-y-3 mb-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="statusConfig.bg">
                  <PhClock v-if="queueStatus === 'scheduled'" class="w-4 h-4" :class="statusConfig.color" weight="fill" />
                  <PhCookingPot v-else-if="queueStatus === 'cooking'" class="w-4 h-4" :class="statusConfig.color" weight="fill" />
                  <PhCheckCircle v-else-if="queueStatus === 'ready'" class="w-4 h-4" :class="statusConfig.color" weight="fill" />
                  <PhXCircle v-else class="w-4 h-4" :class="statusConfig.color" weight="fill" />
                </div>
                <span class="text-[14px] font-semibold" :class="statusConfig.textClass">{{ statusConfig.text }}</span>
              </div>
              <button v-if="canEdit" class="text-[12px] text-primary font-semibold underline active:scale-[0.98]" @click="editRecipe">
                Edit Recipe
              </button>
            </div>

            <div class="flex items-center gap-2 text-[13px] text-gray-500">
              <PhUsers class="w-4 h-4" />
              <span>{{ participants.length }} joined</span>
            </div>

            <button
                v-if="isEntryCook && queueStatus === 'scheduled'"
                class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                :disabled="saving"
                @click="startCooking"
            >
              <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
              <template v-else>
                <PhCookingPot class="w-5 h-5" weight="fill" />
                Start Cooking
              </template>
            </button>

            <button
                v-else-if="isEntryCook && queueStatus === 'cooking'"
                class="w-full h-14 rounded-2xl bg-green-pastel text-app-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
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

        <!-- Smart adaptive button -->
        <button
          v-if="!hasActiveQueue"
          class="w-full h-14 rounded-2xl border border-primary text-primary font-semibold text-[16px] bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          @click="showDatePicker = true"
        >
          🍳 Cook This
        </button>
        <button
          v-else-if="joined"
          class="w-full h-14 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-[16px] flex items-center justify-center gap-2 cursor-not-allowed mb-3"
          disabled
        >
          <PhCheckCircle class="w-5 h-5" weight="fill" />
          Joined
        </button>
        <button
          v-else
          class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
          :disabled="!canJoin"
          @click="onJoin"
        >
          <PhForkKnife class="w-5 h-5" weight="fill" />
          Join Lunch
        </button>


      </div>
    </template>

    <!-- Balance block overlay -->
    <div
      v-if="joinBlockedReason"
      class="absolute inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
      @click.self="joinBlockedReason = ''"
    >
      <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
        <h3 class="text-[16px] font-bold text-app-black mb-2">Action blocked</h3>
        <p class="text-[13px] text-app-black/70 leading-relaxed">{{ joinBlockedReason }}</p>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 h-11 rounded-full bg-primary text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="joinBlockedReason = ''"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- Date picker modal -->
    <div
      v-if="showDatePicker"
      class="absolute inset-0 z-50 flex flex-col justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="showDatePicker = false" />
      <div class="relative bg-white rounded-t-2xl pb-8 px-5 pt-5 max-h-[70%] flex flex-col">
        <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 shrink-0" />
        <div class="flex items-center justify-between mb-4 shrink-0">
          <h3 class="text-[16px] font-semibold text-app-black">Pick a date to cook</h3>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-medium text-gray-500">{{ currentMonthLabel }}</span>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:scale-[0.95] transition-transform disabled:opacity-30"
              :disabled="dateOffset === 0"
              @click="prevWeekPage"
            >
              <PhCaretLeft class="w-4 h-4 text-app-black" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:scale-[0.95] transition-transform"
              @click="nextWeekPage"
            >
              <PhCaretLeft class="w-4 h-4 text-app-black rotate-180" />
            </button>
          </div>
        </div>

        <div v-if="datePickerLoading" class="flex items-center justify-center py-8">
          <PhSpinner class="w-6 h-6 text-primary animate-spin" />
        </div>

        <div v-else class="grid grid-cols-5 gap-3 overflow-y-auto scrollbar-hide">
          <div v-for="d in availableDates" :key="d.iso">
            <button
              class="w-full flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-150"
              :class="dateCellClass(d)"
              @click="selectDate(d.iso)"
            >
              <span class="text-[11px] font-medium">{{ d.isToday ? 'Today' : d.label }}</span>
              <span class="text-[16px] font-semibold mt-0.5" :class="d.isToday && !d.isTaken && !d.isPast ? 'text-primary' : 'text-app-black'">{{ d.dateNum }}</span>
<!--              <span v-if="d.isTaken" class="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1" />-->
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Copied toast -->
    <div
      v-if="showCopiedToast"
      class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-app-black text-white text-[13px] rounded-full px-4 py-2 z-50 whitespace-nowrap"
    >
      Copied to clipboard!
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhHeart, PhChefHat, PhForkKnife, PhCaretDown, PhSpinner, PhX, PhCookingPot, PhCheckCircle, PhUsers, PhXCircle, PhClock, PhShareNetwork } from '@phosphor-icons/vue'
import { getIngredientIcon } from '~/utils/ingredientIcons'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()
const { request } = useDirectus()
const { user } = useAuth()

interface RecipeData {
  id: string
  dish_name: string
  category: string | null
  description: string | null
  photo: string | null
  ingredients: { name: string; amount: string; unit: string }[] | null
  steps: { step: number; description: string }[] | null
  cook_name: string | null
  cook_id: string | null
  source_cook_queue: string | null
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

interface Participant {
  id: string
  name: string
}

interface QueueEntry {
  id: string
  status: string
  date: string
  cook?: { id: string }
}

const loading = ref(true)
const recipe = ref<RecipeData | null>(null)
const showIngredients = ref(true)
const showSteps = ref(false)

const saving = ref(false)
const participants = ref<Participant[]>([])
const activeCqId = ref<string | null>(null)
const queueEntry = ref<QueueEntry | null>(null)

const showDatePicker = ref(false)
const datePickerLoading = ref(false)
const dateOffset = ref(0)
const availableDates = ref<{ label: string; dateNum: number; iso: string; isTaken: boolean; isPast: boolean; isToday: boolean; isMonthStart: boolean }[]>([])

const isLiked = ref(false)
const likeCount = ref(0)
const myLikeId = ref<string | null>(null)

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function dateCellClass(d: { isPast: boolean; isToday: boolean; isTaken: boolean; isMonthStart: boolean }): string {
  if (d.isPast) return 'opacity-30 pointer-events-none cursor-not-allowed bg-app-bg'
  if (d.isToday) return 'bg-primary-light text-primary font-semibold active:scale-[0.98] transition-transform cursor-pointer'
  if (d.isMonthStart) return 'bg-[#CBFFCF] text-app-black border border-gray-200 active:scale-[0.98] transition-transform cursor-pointer'
  if (d.isTaken) return 'pointer-events-none cursor-not-allowed bg-app-bg relative'
  return 'bg-white border border-gray-200 text-app-black active:bg-primary-light active:scale-[0.98] transition-transform cursor-pointer'
}

function fmtISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function prevWeekPage() {
  const step = Math.min(15, dateOffset.value)
  dateOffset.value -= step
  loadDates()
}

function nextWeekPage() {
  dateOffset.value += 15
  loadDates()
}

const currentMonthLabel = computed(() => {
  const first = availableDates.value[0]
  if (!first) return ''
  const d = new Date(first.iso + 'T12:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
})

async function loadDates() {
  datePickerLoading.value = true
  const today = fmtISO(new Date())
  let takenSet = new Set<string>()
  try {
    const taken = await request<{ date: string }[]>('get',
      `/items/cook_queue?fields=date&filter[status][_neq]=cancelled&filter[date][_gte]=${today}`
    )
    takenSet = new Set(taken.map(t => t.date))
  } catch { /* ignore */ }

  const todayStr = fmtISO(new Date())
  const dates: { label: string; dateNum: number; iso: string; isTaken: boolean; isPast: boolean; isToday: boolean; isMonthStart: boolean }[] = []
  let i = 0
  let weekdaysSkipped = 0
  while (dates.length < 15) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      if (weekdaysSkipped < dateOffset.value) {
        weekdaysSkipped++
      } else {
        const iso = fmtISO(d)
        dates.push({
          label: DAY_SHORT[dow],
          dateNum: d.getDate(),
          iso,
          isTaken: takenSet.has(iso),
          isPast: iso < todayStr,
          isToday: iso === todayStr,
          isMonthStart: d.getDate() === 1,
        })
      }
    }
    i++
  }
  availableDates.value = dates
  datePickerLoading.value = false
}

watch(showDatePicker, (open) => {
  if (!open) return
  dateOffset.value = 0
  loadDates()
})

function selectDate(date: string) {
  const entry = availableDates.value.find(d => d.iso === date)
  if (!entry || entry.isPast || entry.isTaken || !recipe.value?.id) return
  showDatePicker.value = false
  router.push(`/cook?action=become&date=${date}&recipeId=${recipe.value.id}`)
}

const cqParam = computed(() => route.query.cq as string | undefined)
const participantsCqId = computed(() => cqParam.value ?? activeCqId.value ?? null)
const { confirmed: participantCount, hasJoined: joined, joinBlockedReason, join: onJoin, fetch: refreshParticipants } = useParticipants(participantsCqId)

const hasActiveEntry = computed(() => !!(cqParam.value ?? activeCqId.value))

const hasActiveQueue = computed(() => {
  if (!queueEntry.value) return false
  return ['scheduled', 'cooking', 'ready'].includes(queueStatus.value ?? '')
})

const queueStatus = computed(() => queueEntry.value?.status ?? null)
const queueDateStr = computed(() => {
  if (!queueEntry.value?.date) return ''
  const d = new Date(queueEntry.value.date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
})

const canJoin = computed(() => queueStatus.value === 'scheduled' || queueStatus.value === 'cooking')

const statusConfig = computed(() => {
  switch (queueStatus.value) {
    case 'scheduled': return {
      bg: 'bg-purple-100',
      color: 'text-purple-600',
      textClass: 'text-purple-600',
      text: `Scheduled for ${queueDateStr.value}`,
    }
    case 'cooking': return {
      bg: 'bg-green-pastel',
      color: 'text-green-700',
      textClass: 'text-app-black',
      text: 'Cooking in progress',
    }
    case 'ready': return {
      bg: 'bg-green-pastel',
      color: 'text-green-700',
      textClass: 'text-app-black',
      text: 'Lunch is ready!',
    }
    case 'cancelled': return {
      bg: 'bg-gray-100',
      color: 'text-gray-400',
      textClass: 'text-gray-400',
      text: 'Cancelled',
    }
    case 'completed': return {
      bg: 'bg-gray-100',
      color: 'text-gray-400',
      textClass: 'text-gray-400',
      text: 'Completed',
    }
    default: return null
  }
})

const recipeImage = useRecipeImage(recipe)

const isOwner = computed(() => {
  if (!user.value || !recipe.value?.cook_id) return false
  return user.value.id === recipe.value.cook_id
})

const isEntryCook = computed(() => {
  if (!user.value || !queueEntry.value?.cook) return false
  const c = queueEntry.value.cook
  const cookId = typeof c === 'object' ? c.id : c
  return !!cookId && cookId === user.value.id
})

const canEdit = computed(() => {
  return isOwner.value || isEntryCook.value
})

function editRecipe() {
  router.push(`/recipe/create?id=${recipe.value?.id}&name=${encodeURIComponent(recipe.value?.dish_name || '')}`)
}

async function fetchLikes() {
  const recipeId = recipe.value?.id
  if (!recipeId) return
  try {
    const likes = await request<any[]>('get',
      `/items/recipe_likes?filter[recipe][_eq]=${recipeId}&fields=id,user`
    )
    likeCount.value = likes.length
    const mine = likes.find(l => l.user === user.value?.id)
    isLiked.value = !!mine
    myLikeId.value = mine?.id ?? null
  } catch {
    // collection may not exist yet
  }
}

async function toggleLike() {
  if (!recipe.value?.id || !user.value?.id) return
  if (isLiked.value && myLikeId.value) {
    try {
      await request('delete', `/items/recipe_likes/${myLikeId.value}`)
      isLiked.value = false
      likeCount.value--
      myLikeId.value = null
    } catch { /* ignore */ }
  } else {
    try {
      const newLike = await request<any>('post', '/items/recipe_likes', {
        recipe: recipe.value.id,
        user: user.value.id,
      })
      isLiked.value = true
      likeCount.value++
      myLikeId.value = newLike.id
    } catch { /* ignore */ }
  }
}

async function fetchParticipants(id: string) {
  try {
    const orders = await request<OrderEntry[]>('get',
      `/items/orders?filter[cook_queue][_eq]=${id}&filter[status][_eq]=confirmed&fields=*,user.id,user.first_name,user.last_name`
    )
    participants.value = orders.map((o) => ({
      id: o.user.id,
      name: [o.user.first_name, o.user.last_name].filter(Boolean).join(' ') || 'Unknown',
    }))
  } catch {
    // ignore
  }
}

async function startCooking() {
  const id = activeCqId.value
  if (!id) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${id}`, {
      status: 'cooking',
    })
    if (queueEntry.value) queueEntry.value.status = 'cooking'
  } catch (e) {
    console.error('Failed to start cooking:', e)
  }
  saving.value = false
}

async function markReady() {
  const id = activeCqId.value
  if (!id) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${id}`, {
      status: 'ready',
    })
    if (queueEntry.value) queueEntry.value.status = 'ready'
  } catch (e) {
    console.error('Failed to mark ready:', e)
  }
  saving.value = false
}

const showCopiedToast = ref(false)

const shoppingListText = computed(() => {
  if (!recipe.value?.ingredients || recipe.value.ingredients.length === 0) return ''
  const lines = recipe.value.ingredients.map(ing => {
    const amount = ing.amount || ''
    const unit = ing.unit || ''
    const amountStr = amount && unit ? `${amount} ${unit}` : amount || unit
    return `${ing.name} — ${amountStr}`
  })
  return `🛒 ${recipe.value.dish_name}\n\n${lines.join('\n')}\n\nItoCook`
})

async function shareShoppingList() {
  const text = shoppingListText.value
  if (!text) return
  const nav: any = navigator
  if (nav.share) {
    try {
      await nav.share({ title: recipe.value?.dish_name, text })
    } catch {
      /* user cancelled */
    }
  } else {
    try {
      await nav.clipboard.writeText(text)
      showCopiedToast.value = true
      setTimeout(() => { showCopiedToast.value = false }, 2000)
    } catch {
      /* clipboard not available */
    }
  }
}

onMounted(async () => {
  const id = route.params.id as string
  try {
    const item = await request<{
      id: string
      dish_name: string
      category: string | null
      description: string | null
      photo: string | null
      ingredients: string | null
      steps: string | null
      cook: { id: string; first_name: string; last_name: string } | string | null
      source_cook_queue: string | null
    }>('get', `/items/recipes/${id}?fields=id,dish_name,category,description,photo,ingredients,steps,source_cook_queue,cook.id,cook.first_name,cook.last_name`)

    let cookName: string | null = null
    let cookId: string | null = null
    if (item.cook && typeof item.cook === 'object') {
      cookName = [item.cook.first_name, item.cook.last_name].filter(Boolean).join(' ') || 'Unknown'
      cookId = item.cook.id
    }

    let ingredients: { name: string; amount: string; unit: string }[] | null = null
    if (item.ingredients) {
      try {
        ingredients = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients
      } catch { /* ignore */ }
    }

    let steps: { step: number; description: string }[] | null = null
    if (item.steps) {
      try {
        steps = typeof item.steps === 'string' ? JSON.parse(item.steps) : item.steps
      } catch { /* ignore */ }
    }

    recipe.value = {
      id: item.id,
      dish_name: item.dish_name,
      category: item.category,
      description: item.description,
      photo: item.photo,
      ingredients,
      steps,
      cook_name: cookName,
      cook_id: cookId,
      source_cook_queue: item.source_cook_queue,
    }

    // Fetch linked queue entry data (for status display + active CQ ID)
    if (cqParam.value) {
      try {
        const entry = await request<QueueEntry>('get',
          `/items/cook_queue/${cqParam.value}?fields=id,status,date,cook.id`
        )
        queueEntry.value = entry
        activeCqId.value = entry.id
      } catch { /* ignore */ }
    } else {
      const today = new Date().toISOString().split('T')[0]
      try {
        const entries = await request<QueueEntry[]>('get',
          `/items/cook_queue?filter[dish_name][_eq]=${encodeURIComponent(item.dish_name)}&filter[date][_gte]=${today}&limit=1&fields=id,status,date,cook.id`
        )
        if (entries.length > 0) {
          activeCqId.value = entries[0]!.id
          queueEntry.value = entries[0]!
        }
      } catch { /* ignore */ }
    }

    const targetId = activeCqId.value
    if (targetId) {
      await fetchParticipants(targetId)
      await refreshParticipants()
    }

    await fetchLikes()
  } catch (e) {
    console.error('Failed to fetch recipe:', e)
  }
  loading.value = false
  console.log('[recipe] useRecipeImage output:', recipeImage.value)
})

</script>
