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
          v-if="isEntryCook"
          class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
          @click="router.push('/shopping-list')"
        >
          <PhShoppingCart :size="20" weight="fill" class="text-primary" />
        </button>
        <button
          v-else
          @click="toggleLike"
          class="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
        >
          <PhHeart :size="20" :weight="isLiked ? 'fill' : 'regular'" :class="isLiked ? 'text-red-500' : 'text-gray-400'" />
        </button>
        <button
          v-if="displayCookName"
          class="absolute bottom-3 left-3 flex items-center gap-2 bg-white/80 rounded-full px-3 py-1.5 shadow-sm active:scale-[0.98] transition-transform"
          @click="openCookRecipes"
        >
          <img
            v-if="displayCookAvatar"
            :src="displayCookAvatar"
            :alt="displayCookName"
            class="w-6 h-6 rounded-full object-cover"
          />
          <div v-else class="w-6 h-6 rounded-full overflow-hidden">
            <AvatarPlaceholder />
          </div>
          <span class="text-[12px] font-medium text-app-black">by {{ displayCookName }}</span>
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

          <!-- Servings selector -->
          <div v-if="!hasActiveQueue || isEntryCook" class="mb-5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="text-[13px] text-gray-500 font-medium">Portions</span>
                <button
                  v-for="n in sr.servingsPresets"
                  :key="n"
                  class="min-w-[44px] h-9 px-3 text-[14px] font-semibold rounded-xl transition-all active:scale-[0.98]"
                  :class="sr.activeServings === n ? 'bg-primary text-white' : 'bg-gray-100 text-app-black'"
                  @click="sr.selectServing(n)"
                >
                  {{ n }}
                </button>
                <button
                  class="min-w-[44px] h-9 px-3 rounded-xl bg-gray-100 text-app-black flex items-center justify-center active:scale-[0.98]"
                  @click="sr.showCustomServings = !sr.showCustomServings"
                >
                  <PhPlus class="w-5 h-5" weight="bold" />
                </button>
              </div>
              <div v-if="queueEntry" class="flex items-center gap-1 shrink-0">
                <PhUsers class="w-4 h-4 text-gray-500" />
                <span class="text-[14px] text-gray-500 font-medium">{{ participantsList.length }}</span>
              </div>
            </div>
            <div
              v-if="sr.showCustomServings"
              class="flex items-center gap-2 mt-2"
            >
              <input
                v-model="sr.customServingsInput"
                type="number"
                min="1"
                max="100"
                placeholder="15"
                class="w-20 h-9 rounded-xl border border-gray-200 text-[14px] text-center font-semibold outline-none focus:border-primary"
                @keyup.enter="sr.applyCustomServing"
              />
              <button
                class="h-9 px-4 rounded-xl bg-primary text-white text-[13px] font-semibold active:scale-[0.98]"
                @click="sr.applyCustomServing"
              >
                Apply
              </button>
            </div>
            <button
              v-if="queueEntry && participantCount > 0 && participantCount !== sr.activeServings"
              class="mt-2 bg-primary-pale text-primary text-[13px] rounded-full px-3 py-1 font-medium active:scale-[0.98] transition-transform"
              @click="sr.saveServingsToRecipe(participantCount)"
            >
              ↺ Apply for {{ participantCount }} participants
            </button>
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
                class="w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-[0.98] transition-transform shadow-sm"
                @click="showShareModal = true"
                title="Share shopping list"
              >
                <PhUploadSimple class="w-5 h-5 text-white" />
              </button>
            </div>
            <ul v-if="showIngredients" class="space-y-2">
              <li v-for="(ing, i) in recipe.ingredients" :key="i" class="flex items-center gap-3 text-[14px] text-app-black/70">
                <span class="text-lg w-6 text-center shrink-0">{{ getIngredientIcon(ing.name) }}</span>
                <span>{{ ing.name }}</span>
                <span v-if="ing.amount || ing.unit" class="shrink-0 ml-auto flex items-center gap-1" :class="sr.isScaling ? 'text-primary font-semibold' : 'font-medium text-app-black'">
                  <span v-if="sr.isSpiceUnit(ing.unit)" class="text-[10px] text-gray-400 font-normal">(to taste)</span>
                  {{ sr.scaleAmount(ing.amount, ing.unit) }}{{ ing.unit ? ' ' + ing.unit : '' }}
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

        <!-- Smart adaptive button (not for entry cook — handled in status block above) -->
        <button
          v-if="!hasActiveQueue"
          class="w-full h-14 rounded-2xl border border-primary text-primary font-semibold text-[16px] bg-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          @click="showDatePicker = true"
        >
          🍳 Cook This
        </button>
        <button
          v-else-if="joined && !isEntryCook"
          class="w-full h-14 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-[16px] flex items-center justify-center gap-2 cursor-not-allowed mb-3"
          disabled
        >
          <PhCheckCircle class="w-5 h-5" weight="fill" />
          Joined
        </button>
        <button
          v-else-if="!isEntryCook"
          class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
          :disabled="!canJoin"
          @click="onJoin"
        >
          <PhForkKnife class="w-5 h-5" weight="fill" />
          Join Lunch
        </button>


      </div>
    </template>

    <ActionBlockedModal
      :show="!!joinBlockedReason"
      :message="joinBlockedReason"
      @close="joinBlockedReason = ''"
    />

    <!-- Date picker modal -->
    <div
      v-if="showDatePicker"
      class="absolute inset-0 z-50 flex flex-col justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="showDatePicker = false" />
      <div class="relative bg-white rounded-t-2xl pb-8 px-5 pt-5 max-h-[70%] flex flex-col">
        <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 shrink-0" />
        <h3 class="text-[16px] font-semibold text-app-black mb-4 shrink-0">Pick a date to cook</h3>

        <div v-if="datePickerLoading" class="flex items-center justify-center py-8">
          <PhSpinner class="w-6 h-6 text-primary animate-spin" />
        </div>

        <MonthCalendar
          v-else
          :current-month="pickerMonth"
          :entries="pickerEntries"
          @select="selectDate"
          @prev-month="prevWeekPage"
          @next-month="nextWeekPage"
        />
      </div>
    </div>
    <!-- Cook recipes modal -->
    <div
      v-if="showCookRecipes"
      class="absolute inset-0 z-50 flex flex-col justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="showCookRecipes = false" />
      <div class="relative bg-white rounded-t-2xl pb-8 px-5 pt-5 max-h-[60%] flex flex-col">
        <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-3 shrink-0" />
        <h3 class="text-[16px] font-semibold text-app-black mb-1 shrink-0">Recipes by {{ displayCookName }}</h3>
        <p class="text-[12px] text-gray-500 mb-4 shrink-0">{{ cookRecipes.length }} recipes</p>

        <div v-if="cookRecipesLoading" class="flex items-center justify-center py-8">
          <PhSpinner class="w-6 h-6 text-primary animate-spin" />
        </div>

        <template v-else-if="cookRecipes.length === 0">
          <div class="flex flex-col items-center justify-center py-8">
            <p class="text-[13px] text-gray-400">No recipes yet</p>
          </div>
        </template>
        <SliderList v-else :items="cookRecipes" :visible-count="3" :item-height="72">
          <template #item="{ item: r }">
            <div
              class="rounded-xl bg-gray-50 px-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform h-full"
              @click="router.push(`/recipe/${r.id}`); showCookRecipes = false"
            >
              <div class="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0 overflow-hidden">
                <img v-if="r.photo" :src="`http://localhost:8055/assets/${r.photo}`" class="w-full h-full object-cover" alt="" />
                <PhCookingPot v-else class="w-5 h-5 text-primary" weight="fill" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-semibold text-app-black truncate leading-tight">{{ r.dish_name }}</p>
                <p v-if="r.category" class="text-[11px] text-gray-500 capitalize mt-0.5">{{ r.category }}</p>
              </div>
              <PhEye class="w-5 h-5 text-gray-400 shrink-0" />
            </div>
          </template>
        </SliderList>
      </div>
    </div>

    <!-- Shopping list modal -->
    <div
      v-if="showShareModal"
      class="absolute inset-0 z-50 flex flex-col justify-end"
    >
      <div class="absolute inset-0 bg-black/40" @click="showShareModal = false" />
      <div class="relative bg-white rounded-t-3xl p-6">
        <div class="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-5 shrink-0" />

        <button
          v-if="canAddToList"
          class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
          :disabled="isAddingToList"
          @click="addToShoppingList"
        >
          <PhSpinner v-if="isAddingToList" class="w-5 h-5 animate-spin" />
          <template v-else>
            <PhShoppingCart class="w-5 h-5" weight="fill" />
            Add to Shopping List
          </template>
        </button>

        <button
          class="w-full h-14 rounded-2xl border border-gray-200 bg-white text-app-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
          @click="copyIngredients"
        >
          <PhCopySimple class="w-5 h-5" weight="fill" />
          Copy ingredients
        </button>

        <button
          class="w-full h-14 rounded-2xl border border-gray-200 bg-white text-app-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mb-3"
          @click="shareShoppingList"
        >
          <PhShareNetwork class="w-5 h-5" weight="fill" />
          Share recipe
        </button>

        <button
          class="w-full h-12 text-[14px] text-gray-500 font-medium active:scale-[0.98] transition-transform"
          @click="showShareModal = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Copied toast -->
    <div
      v-if="showCopiedToast"
      class="absolute bottom-20 left-1/2 -translate-x-1/2 bg-app-black text-white text-[13px] rounded-full px-4 py-2 z-50 whitespace-nowrap"
    >
      Copied to clipboard!
    </div>

    <!-- Added toast -->
    <div
      v-if="showAddedToast"
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-app-black text-white text-[13px] rounded-full pl-4 pr-1 py-1"
    >
      <span class="whitespace-nowrap">Added {{ addedToastCount }} {{ addedToastCount === 1 ? 'item' : 'items' }} 👍</span>
      <button
        class="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-[0.98] transition-transform"
        @click="router.push('/shopping-list')"
      >
        <PhShoppingCart class="w-4 h-4 text-app-black" weight="fill" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhHeart, PhForkKnife, PhCaretDown, PhSpinner, PhX, PhCookingPot, PhCheckCircle, PhUsers, PhXCircle, PhClock, PhUploadSimple, PhPlus, PhEye, PhShoppingCart, PhCopySimple, PhShareNetwork } from '@phosphor-icons/vue'
import { getIngredientIcon } from '~/utils/ingredientIcons'
import type { CalendarEntry } from '~/components/MonthCalendar.vue'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()
const { request } = useDirectus()
const { user } = useAuth()
const config = useRuntimeConfig()
const directusUrl = config.public.directusUrl

interface RecipeData {
  id: string
  dish_name: string
  category: string | null
  description: string | null
  photo: string | null
  servings: number | null
  ingredients: { name: string; amount: string; unit: string }[] | null
  steps: { step: number; description: string }[] | null
  cook_name: string | null
  cook_id: string | null
  cook_avatar: string | null
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


interface QueueEntry {
  id: string
  status: string
  date: string
  cook?: { id: string; first_name?: string; last_name?: string; avatar?: string }
}

interface CookRecipeItem {
  id: string
  dish_name: string
  category: string | null
  photo: string | null
}

const loading = ref(true)
const recipe = ref<RecipeData | null>(null)
const sr = reactive(useRecipeServings(recipe))
const showIngredients = ref(true)
const showSteps = ref(false)

const saving = ref(false)

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

const pickerMonth = computed(() => {
  if (availableDates.value.length === 0) return new Date()
  const first = availableDates.value[0]
  const d = parseISODate(first.iso)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
})

const pickerEntries = computed<CalendarEntry[]>(() =>
  availableDates.value.map(d => {
    let cellClass = ''
    if (d.isPast) cellClass = 'text-gray-300 pointer-events-none'
    else if (d.isTaken) cellClass = 'bg-primary-light opacity-60 pointer-events-none'
    return { date: d.iso, cellClass: cellClass || undefined }
  })
)

function prevWeekPage() {
  const step = Math.min(15, dateOffset.value)
  dateOffset.value -= step
  loadDates()
}

function nextWeekPage() {
  dateOffset.value += 15
  loadDates()
}

async function loadDates() {
  datePickerLoading.value = true
  const today = formatDateISO(new Date())
  let takenSet = new Set<string>()
  try {
    const taken = await request<{ date: string }[]>('get',
      `/items/cook_queue?fields=date&filter[status][_neq]=cancelled&filter[date][_gte]=${today}`
    )
    takenSet = new Set(taken.map(t => t.date))
  } catch { /* ignore */ }

  const todayStr = formatDateISO(new Date())
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
        const iso = formatDateISO(d)
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
const { confirmed: participantCount, hasJoined: joined, joinBlockedReason, join: onJoin, fetch: refreshParticipants, participantsList } = useParticipants(participantsCqId)

const hasActiveEntry = computed(() => !!(cqParam.value ?? activeCqId.value))

const hasActiveQueue = computed(() => {
  if (!queueEntry.value) return false
  return ['scheduled', 'cooking', 'ready'].includes(queueStatus.value ?? '')
})

const queueStatus = computed(() => queueEntry.value?.status ?? null)
const queueDateStr = computed(() => {
  if (!queueEntry.value?.date) return ''
  return formatDateReadable(queueEntry.value.date)
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

const displayCookName = computed(() => {
  if (recipe.value?.cook_name) return recipe.value.cook_name
  if (queueEntry.value?.cook && typeof queueEntry.value.cook === 'object' && 'first_name' in queueEntry.value.cook) {
    const c = queueEntry.value.cook as { id: string; first_name?: string; last_name?: string; avatar?: string }
    return formatUserName(c)
  }
  return null
})

const displayCookId = computed(() => {
  if (recipe.value?.cook_id) return recipe.value.cook_id
  if (queueEntry.value?.cook && typeof queueEntry.value.cook === 'object') {
    return queueEntry.value.cook.id
  }
  return null
})

const displayCookAvatar = computed(() => {
  if (recipe.value?.cook_avatar) {
    return `${directusUrl}/assets/${recipe.value.cook_avatar}`
  }
  if (queueEntry.value?.cook && typeof queueEntry.value.cook === 'object' && 'avatar' in queueEntry.value.cook && queueEntry.value.cook.avatar) {
    return `${directusUrl}/assets/${queueEntry.value.cook.avatar}`
  }
  return null
})

const canEdit = computed(() => {
  return isOwner.value || isEntryCook.value
})

// Cook recipes modal
const showCookRecipes = ref(false)
const cookRecipes = ref<CookRecipeItem[]>([])
const cookRecipesLoading = ref(false)
async function fetchCookRecipes(cookId: string) {
  cookRecipesLoading.value = true
  try {
    const items = await request<any[]>('get',
      `/items/recipes?filter[user_created][_eq]=${cookId}&sort=-date_created&fields=id,dish_name,category,photo`
    )
    cookRecipes.value = items.map((r: any) => ({
      id: r.id,
      dish_name: r.dish_name,
      category: r.category ?? null,
      photo: r.photo ?? null,
    }))
  } catch { /* ignore */ }
  cookRecipesLoading.value = false
}

function openCookRecipes() {
  const id = displayCookId.value
  if (!id) return
  fetchCookRecipes(id)
  showCookRecipes.value = true
}

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
    router.push(`/cook?cq=${id}`)
  } catch (e) {
    console.error('Failed to mark ready:', e)
  }
  saving.value = false
}

const showCopiedToast = ref(false)
const showShareModal = ref(false)
const isAddingToList = ref(false)
const showAddedToast = ref(false)
const addedToastCount = ref(0)

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

function copyIngredientsText(): string {
  if (!recipe.value?.ingredients || recipe.value.ingredients.length === 0) return ''
  const ratio = sr.activeServings / sr.baseServings
  const lines = recipe.value.ingredients.map(ing => {
    const scaledAmount = ing.amount ? parseFloat((parseFloat(ing.amount) * ratio).toFixed(1)) : null
    const amountStr = scaledAmount ? `${scaledAmount}` : ''
    const unitStr = ing.unit || ''
    const fullAmount = amountStr && unitStr ? `${amountStr} ${unitStr}` : amountStr || unitStr
    const emoji = getIngredientIcon(ing.name)
    const amountPart = fullAmount ? ` ${fullAmount}` : ''
    return `• ${emoji} ${ing.name}${amountPart}`
  })
  return `${recipe.value.dish_name} (${sr.activeServings} portions)\n${lines.join('\n')}`
}

const canAddToList = computed(() => isEntryCook.value)

async function addToShoppingList() {
  if (!recipe.value?.ingredients?.length) return
  isAddingToList.value = true
  const ratio = sr.activeServings / sr.baseServings
  const cookDate = queueEntry.value?.date ?? null
  const items = recipe.value.ingredients.map(ing => ({
    user: user.value!.id,
    recipe: recipe.value!.id,
    recipe_name: recipe.value!.dish_name,
    ingredient_name: ing.name,
    amount: ing.amount ? parseFloat((parseFloat(ing.amount) * ratio).toFixed(1)) : null,
    unit: ing.unit ?? null,
    emoji: getIngredientIcon(ing.name) ?? null,
    is_checked: false,
    cook_date: cookDate,
  }))
  try {
    await Promise.all(
      items.map(item => request('post', '/items/shopping_list_items', item))
    )
    addedToastCount.value = items.length
    showAddedToast.value = true
    setTimeout(() => { showAddedToast.value = false }, 2000)
  } catch {
    /* silently fail */
  }
  isAddingToList.value = false
  showShareModal.value = false
}

async function copyIngredients() {
  const text = copyIngredientsText()
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    showCopiedToast.value = true
    setTimeout(() => { showCopiedToast.value = false }, 2000)
  } catch {
    /* clipboard not available */
  }
  showShareModal.value = false
}

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
  showShareModal.value = false
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
      servings: number | null
      ingredients: string | null
      steps: string | null
      cook: { id: string; first_name: string; last_name: string } | string | null
      source_cook_queue: string | null
    }>('get', `/items/recipes/${id}?fields=id,dish_name,category,description,photo,servings,ingredients,steps,source_cook_queue,cook.id,cook.first_name,cook.last_name,cook.avatar`)

    let cookName: string | null = null
    let cookId: string | null = null
    let cookAvatar: string | null = null
    if (item.cook && typeof item.cook === 'object') {
      cookName = formatUserName(item.cook)
      cookId = item.cook.id
      cookAvatar = (item.cook as { avatar?: string }).avatar ?? null
    }

    let ingredients: { name: string; amount: string; unit: string }[] | null = null
    if (item.ingredients) {
      try {
        ingredients = parseJsonField<{ name: string; amount: string; unit: string }[]>(item.ingredients)
      } catch { /* ignore */ }
    }

    let steps: { step: number; description: string }[] | null = null
    if (item.steps) {
      try {
        steps = parseJsonField<{ step: number; description: string }[]>(item.steps)
      } catch { /* ignore */ }
    }

    recipe.value = {
      id: item.id,
      dish_name: item.dish_name,
      category: item.category,
      description: item.description,
      photo: item.photo,
      servings: item.servings ?? null,
      ingredients,
      steps,
      cook_name: cookName,
      cook_id: cookId,
      cook_avatar: cookAvatar,
      source_cook_queue: item.source_cook_queue,
    }

    // Fetch linked queue entry data (for status display + active CQ ID)
    if (cqParam.value) {
      try {
        const entry = await request<QueueEntry>('get',
          `/items/cook_queue/${cqParam.value}?fields=id,status,date,cook.id,cook.first_name,cook.last_name,cook.avatar`
        )
        queueEntry.value = entry
        activeCqId.value = entry.id
      } catch { /* ignore */ }
    } else {
      const today = new Date().toISOString().split('T')[0]
      try {
        // Search by recipe ID first (reliable link), then fall back to dish_name
        const userFilter = user.value?.id ? `&filter[cook][_eq]=${user.value.id}` : ''
        let entries = await request<QueueEntry[]>('get',
          `/items/cook_queue?filter[recipe][_eq]=${item.id}&filter[date][_gte]=${today}${userFilter}&limit=1&fields=id,status,date,cook.id,cook.first_name,cook.last_name,cook.avatar`
        )
        if (entries.length === 0) {
          entries = await request<QueueEntry[]>('get',
            `/items/cook_queue?filter[dish_name][_eq]=${encodeURIComponent(item.dish_name)}&filter[date][_gte]=${today}${userFilter}&limit=1&fields=id,status,date,cook.id,cook.first_name,cook.last_name,cook.avatar`
          )
        }
        if (entries.length > 0) {
          activeCqId.value = entries[0]!.id
          queueEntry.value = entries[0]!
        }
      } catch { /* ignore */ }
    }

    const targetId = activeCqId.value
    if (targetId) {
      await refreshParticipants()
    }

    await fetchLikes()
  } catch (e) {
    console.error('Failed to fetch recipe:', e)
  }
  loading.value = false
})

</script>
