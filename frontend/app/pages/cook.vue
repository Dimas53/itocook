<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Cook Panel</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">
          {{ pageTitle }}
        </h1>
      </div>
      <button class="w-10 h-10 flex items-center justify-center" @click="router.push('/kitchen')">
        <PhX class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-4 space-y-4 flex-1">

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

          <div>
            <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">
              Category
            </label>
            <select
              v-model="selectedCategory"
              class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black focus:outline-none focus:border-primary appearance-none"
            >
              <option value="">Select category</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c.charAt(0).toUpperCase() + c.slice(1) }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">
              Or pick from history
            </p>
            <div class="space-y-1">
              <!-- Up arrow -->
              <div v-if="pastDishes.length > VISIBLE_COUNT" class="flex justify-center h-6">
                <button
                  class="w-6 h-6 flex items-center justify-center transition-colors"
                  :class="canScrollUp ? 'text-gray-400 active:text-app-black' : 'text-gray-200'"
                  :disabled="!canScrollUp"
                  @click="scrollUp"
                >
                  <PhCaretUp class="w-4 h-4" weight="bold" />
                </button>
              </div>

              <div
                class="space-y-2"
                @touchstart="onTouchStart"
                @touchend="onTouchEnd"
              >
                <div v-if="pastDishes.length === 0" class="text-[13px] text-gray-400 text-center py-6">
                  No past dishes yet
                </div>
                <template v-else>
                  <div class="overflow-hidden relative" :style="{ height: sliderHeight + 'px' }">
                    <div
                      class="transition-transform duration-300 ease-out will-change-transform"
                      :style="{ transform: `translateY(${-historyIndex * ITEM_OFFSET}px)` }"
                    >
                      <div
                        v-for="item in pastDishes"
                        :key="item.id"
                        class="h-[60px] rounded-xl bg-white/70 px-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform mb-2 last:mb-0"
                        @click="selectPastDish(item)"
                      >
                        <div class="flex-1 min-w-0 mr-3">
                          <p class="text-[14px] font-medium text-app-black truncate leading-tight">{{ item.dish_name }}</p>
                          <p class="text-[12px] text-app-black/60 mt-0.5 leading-none">
                            by {{ item.cookName }} &middot; {{ item.dateLabel }}
                          </p>
                        </div>
                        <PhClockCounterClockwise class="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Down arrow -->
              <div v-if="pastDishes.length > VISIBLE_COUNT" class="flex justify-center h-6">
                <button
                  class="w-6 h-6 flex items-center justify-center transition-colors"
                  :class="canScrollDown ? 'text-gray-400 active:text-app-black' : 'text-gray-200'"
                  :disabled="!canScrollDown"
                  @click="scrollDown"
                >
                  <PhCaretDown class="w-4 h-4" weight="bold" />
                </button>
              </div>
            </div>
          </div>

          <template v-if="isToday">
            <button
              class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="!canSchedule || saving"
              @click="createRecipeAndAdd"
            >
              <PhSpinner v-if="saving" class="w-5 h-5 animate-spin mx-auto" />
              <template v-else>
                <PhPlus class="w-5 h-5" weight="bold" />
                <span>Create Recipe &amp; Add to Schedule</span>
              </template>
            </button>
          </template>
          <template v-else>
            <template v-if="matchedRecipe">
              <button
                class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!canSchedule || saving"
                @click="saveMatchedDish"
              >
                <PhSpinner v-if="saving" class="w-5 h-5 animate-spin mx-auto" />
                <span v-else>Add to Schedule</span>
              </button>
            </template>
            <template v-else>
              <button
                class="w-full h-14 rounded-full border-2 border-primary text-primary font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                :disabled="!canSchedule || saving"
                @click="saveDish"
              >
                <PhSpinner v-if="saving" class="w-5 h-5 animate-spin mx-auto" />
                <span v-else>Add to Schedule</span>
              </button>
              <button
                class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!canSchedule || saving"
                @click="createRecipeAndAdd"
              >
                <PhSpinner v-if="saving" class="w-5 h-5 animate-spin mx-auto" />
                <template v-else>
                  <PhPlus class="w-5 h-5" weight="bold" />
                  <span>Create Recipe &amp; Add to Schedule</span>
                </template>
              </button>
            </template>
          </template>
        </div>
      </template>

      <!-- ═══════ SCHEDULED STATE ═══════ -->
      <template v-if="state === 'scheduled'">
        <div class="rounded-2xl bg-primary-light/50 p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <PhClock class="w-5 h-5 text-purple-600" weight="fill" />
            </div>
            <div>
              <p class="text-[14px] font-semibold text-app-black">Scheduled to cook</p>
              <p class="text-[12px] text-gray-500">{{ formattedDate }}</p>
            </div>
          </div>

          <div class="rounded-xl bg-white p-4">
            <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Today's Dish</p>
            <p class="text-[20px] font-bold text-app-black mt-1">{{ cookEntry?.dish_name }}</p>
          </div>

          <template v-if="recipeSearchDone">
            <button
              v-if="existingRecipeId"
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?id=${existingRecipeId}&name=${encodeURIComponent(cookEntry!.dish_name || '')}`)"
            >
              <PhPencil class="w-4 h-4" />
              Edit Recipe
            </button>
            <button
              v-else
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?name=${encodeURIComponent(cookEntry!.dish_name || '')}&date=${pageDateStr}&category=${selectedCategory}`)"
            >
              <PhPlus class="w-4 h-4" weight="bold" />
              Add Recipe
            </button>
          </template>

          <button
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            :disabled="saving"
            @click="startCooking"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
            <PhCookingPot v-else class="w-5 h-5" weight="fill" />
            {{ saving ? 'Starting...' : 'Start Cooking' }}
          </button>

          <button
            class="w-full h-12 rounded-full border border-red-200 text-red-500 font-semibold text-[14px] flex items-center justify-center gap-2 bg-white/80 active:scale-[0.98] transition-transform"
            :disabled="saving || cancelling"
            @click="showCancelDialog = true"
          >
            <PhXCircle class="w-4 h-4" />
            Cancel Cooking
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
              v-if="existingRecipeId"
              class="w-10 h-10 rounded-full bg-white flex items-center justify-center active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/${existingRecipeId}`)"
            >
              <PhEye class="w-5 h-5 text-app-black" />
            </button>
          </div>

          <div class="rounded-xl bg-white p-4">
            <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Today's Dish</p>
            <p class="text-[20px] font-bold text-app-black mt-1">{{ cookEntry?.dish_name }}</p>
          </div>

          <template v-if="recipeSearchDone">
            <button
              v-if="existingRecipeId"
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?id=${existingRecipeId}&name=${encodeURIComponent(cookEntry!.dish_name || '')}`)"
            >
              <PhPencil class="w-4 h-4" />
              Edit Recipe
            </button>
            <button
              v-else
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?name=${encodeURIComponent(cookEntry!.dish_name || '')}&date=${pageDateStr}&category=${selectedCategory}`)"
            >
              <PhPlus class="w-4 h-4" weight="bold" />
              Add Recipe
            </button>
          </template>

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

          <button
            class="w-full h-12 rounded-full border border-red-200 text-red-500 font-semibold text-[14px] flex items-center justify-center gap-2 bg-white/80 active:scale-[0.98] transition-transform"
            :disabled="saving || cancelling"
            @click="showCancelDialog = true"
          >
            <PhXCircle class="w-4 h-4" />
            Cancel Cooking
          </button>
        </div>
      </template>

      <!-- ═══════ READY STATE (meal eaten, cost entry optional) ═══════ -->
      <template v-if="state === 'ready'">
        <div class="rounded-2xl bg-primary-light/50 p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <PhReceipt class="w-5 h-5 text-app-black" weight="fill" />
            </div>
            <div>
              <p class="text-[14px] font-semibold text-app-black">Lunch is served!</p>
              <p class="text-[12px] text-gray-500">Enter the receipt to split the bill</p>
            </div>
            <div v-if="receiptOverdue" class="ml-auto">
              <span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-600 whitespace-nowrap">
                <PhWarning class="w-3 h-3" weight="fill" />
                Cost entry overdue
              </span>
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
                <span class="text-gray-500">Total receipt</span>
                <span class="font-bold text-app-black text-[16px]">€{{ formattedReceipt }}</span>
              </div>
              <div v-if="pastaBreakdown" class="flex justify-between text-[14px]">
                <span class="text-gray-500">{{ pastaBreakdown.label }}</span>
                <span class="font-semibold text-app-black">€{{ pastaBreakdown.amount.toFixed(2) }}</span>
              </div>
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
                <span class="font-bold text-app-black text-[16px]">€{{ grandTotalDisplay }}</span>
              </div>
            </div>

            <div class="rounded-xl bg-yellow-pastel p-4">
              <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Deduction preview</p>
              <div v-if="pastaBreakdown" class="flex justify-between text-[14px] mt-2">
                <span class="text-app-black/70">{{ pastaBreakdown.label }}</span>
                <span class="font-medium text-app-black">€{{ pastaBreakdown.amount.toFixed(2) }}</span>
              </div>
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
            <p v-if="pastaBreakdown" class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Grand total (incl. pasta)</p>
            <p v-else class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Receipt total</p>
            <p class="text-[24px] font-bold text-app-black mt-1">€{{ grandTotalDisplay }}</p>
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

      <!-- Confirm cancel overlay -->
      <div
        v-if="showCancelDialog"
        class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
        @click.self="showCancelDialog = false"
      >
        <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
          <h3 class="text-[16px] font-bold text-app-black mb-2">Cancel cooking?</h3>
          <p class="text-[13px] text-app-black/70 leading-relaxed">
            This will cancel the entire cook entry and remove all participants. This action cannot be undone.
          </p>
          <p class="text-[11px] text-app-black/50 mt-2 leading-relaxed">
            No balances or transactions will be affected.
          </p>
          <div class="flex gap-3 mt-5">
            <button
              class="flex-1 h-11 rounded-full border border-gray-200 text-app-black font-semibold text-[14px] active:scale-[0.98] transition-transform"
              @click="showCancelDialog = false"
            >
              Keep Cooking
            </button>
            <button
              class="flex-1 h-11 rounded-full bg-red-500 text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
              :disabled="cancelling"
              @click="cancelCooking"
            >
              <PhSpinner v-if="cancelling" class="w-4 h-4 animate-spin mx-auto" />
              <span v-else>Cancel Entry</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Balance block overlay -->
    <div
      v-if="cookBlockedReason"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center pb-20 pointer-events-auto"
      @click.self="cookBlockedReason = ''"
    >
      <div class="bg-white rounded-2xl mx-5 p-6 w-full max-w-[21rem] shadow-xl">
        <h3 class="text-[16px] font-bold text-app-black mb-2">Action blocked</h3>
        <p class="text-[13px] text-app-black/70 leading-relaxed">{{ cookBlockedReason }}</p>
        <div class="flex gap-3 mt-5">
          <button
            class="flex-1 h-11 rounded-full bg-primary text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            @click="cookBlockedReason = ''"
          >
            OK
          </button>
        </div>
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
  PhPencil,
  PhPlus,
  PhEye,
  PhClock,
  PhWarning,
  PhXCircle,
  PhCaretUp,
  PhCaretDown,
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
  category: string | null
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
  category: string | null
  cookName: string
  dateLabel: string
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
const cancelling = ref(false)
const showCancelDialog = ref(false)
const cookEntry = ref<CookQueueEntry | null>(null)
const dishName = ref('')
const selectedCategory = ref('')
const receiptAmount = ref<string>('')
const participants = ref<Participant[]>([])
const pastDishes = ref<HistoryDish[]>([])
const deductionResult = ref(false)
const historyIndex = ref(0)
const VISIBLE_COUNT = 3
const ITEM_HEIGHT = 60
const ITEM_GAP = 8
const ITEM_OFFSET = ITEM_HEIGHT + ITEM_GAP
const sliderHeight = VISIBLE_COUNT * ITEM_HEIGHT + (VISIBLE_COUNT - 1) * ITEM_GAP
const pastaCost = ref(0)
const pastaBreakdown = ref<{ label: string; amount: number } | null>(null)
const mealCost = useMealCost()

function formatDateStr(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    const h = date.getHours()
    const m = String(date.getMinutes()).padStart(2, '0')
    return `Today ${h}:${m}`
  }
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`
}

const isToday = computed(() => pageDateStr.value === formatDateISO(new Date()))

const CATEGORIES = ['salad', 'soup', 'pasta', 'meat', 'fish', 'dessert', 'pizza', 'other'] as const

const canSchedule = computed(() =>
  dishName.value.trim().length > 0 && !!selectedCategory.value
)

const matchedRecipe = computed(() => {
  if (!dishName.value.trim()) return null
  const name = dishName.value.toLowerCase()
  return pastDishes.value.find(d => d.dish_name.toLowerCase().includes(name)) || null
})

const visiblePastDishes = computed(() => {
  return pastDishes.value.slice(historyIndex.value, historyIndex.value + VISIBLE_COUNT)
})

const canScrollUp = computed(() => historyIndex.value > 0)
const canScrollDown = computed(() => historyIndex.value + VISIBLE_COUNT < pastDishes.value.length)

let touchStartY = 0

function scrollUp() {
  if (canScrollUp.value) historyIndex.value--
}

function scrollDown() {
  if (canScrollDown.value) historyIndex.value++
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]!.clientY
}

function onTouchEnd(e: TouchEvent) {
  const deltaY = e.changedTouches[0]!.clientY - touchStartY
  if (Math.abs(deltaY) > 30) {
    if (deltaY < 0) scrollDown()
    else scrollUp()
  }
}

const existingRecipeId = ref<string | null>(null)
const recipeSearchDone = ref(false)

// ── Computed state machine ──
const state = computed(() => {
  if (loading.value) return 'loading'
  if (!cookEntry.value) return 'assign'
  if (!cookEntry.value.dish_name) return 'dish'
  if (cookEntry.value.status === 'scheduled') return 'scheduled'
  if (cookEntry.value.status === 'cooking') return 'cooking'
  if (cookEntry.value.status === 'ready' && !deductionResult.value) return 'ready'
  return 'done'
})

const pageTitle = computed(() => {
  switch (state.value) {
    case 'assign': return 'Become a Cook'
    case 'dish': return 'What\u2019s Cooking?'
    case 'scheduled': return 'Scheduled'
    case 'cooking': return 'Cooking in Progress'
    case 'ready': return 'Enter Receipt'
    case 'done': return 'Completed'
    default: return 'Cook Panel'
  }
})

const formattedReceipt = computed(() => {
  const val = parseFloat(receiptAmount.value)
  return isNaN(val) ? '0.00' : val.toFixed(2)
})

const sharePerPerson = computed(() => {
  const base = parseFloat(receiptAmount.value)
  if (isNaN(base) || participants.value.length === 0) return '0.00'
  const total = base + pastaCost.value
  return (total / participants.value.length).toFixed(2)
})

const grandTotalDisplay = computed(() => {
  const base = parseFloat(receiptAmount.value)
  const total = (isNaN(base) ? 0 : base) + pastaCost.value
  return total.toFixed(2)
})

const receiptOverdue = computed(() => {
  if (!isToday) return false
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0)
  return now > cutoff
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

// ── Fetch past dishes from recipes collection ──
async function fetchPastDishes() {
  try {
    const items = await request<any[]>('get',
      '/items/recipes?sort=-date_created&fields=id,dish_name,category,cook.id,cook.first_name,cook.last_name,date_created'
    )
    pastDishes.value = items
      .filter((i: any) => i.dish_name)
      .map((r: any) => ({
        id: r.id,
        dish_name: r.dish_name,
        category: r.category ?? null,
        cookName: r.cook ? [r.cook.first_name, r.cook.last_name].filter(Boolean).join(' ') : 'Unknown',
        dateLabel: formatDateStr(new Date(r.date_created)),
      }))
    historyIndex.value = 0
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

const cookBlockedReason = ref('')

// ── Actions ──

async function assignAsCook() {
  const { check } = useBalanceCheck()
  const result = await check()
  if (!result.allowed) {
    cookBlockedReason.value = `Your balance is too low (-€${Math.abs(result.balance).toFixed(2)}). Please top up your balance before becoming cook.`
    return
  }
  saving.value = true
  try {
    const newEntry = await request<CookQueueEntry>('post', '/items/cook_queue', {
      date: pageDateStr.value,
      cook: user.value?.id,
      status: 'scheduled',
    })
    cookEntry.value = newEntry

    // Auto-join: create order for the cook so they appear in participants
    try {
      await request('post', '/items/orders', {
        user: user.value?.id,
        cook_queue: newEntry.id,
        status: 'confirmed',
      })
    } catch { /* order may already exist */ }

    await fetchPastDishes()
  } catch (e) {
    console.error('Failed to assign as cook:', e)
  }
  saving.value = false
}

async function searchExistingRecipe(name: string): Promise<string | null> {
  recipeSearchDone.value = false
  existingRecipeId.value = null
  try {
    // Prefer user's own recipe/fork
    const own = await request<{ id: string }[]>('get',
      `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(name)}&filter[user_created][_eq]=${user.value?.id}&limit=1&fields=id`
    )
    if (own.length > 0) {
      existingRecipeId.value = own[0]!.id
      recipeSearchDone.value = true
      return own[0]!.id
    }
    // Fallback to any recipe with that name (will be forked)
    const any = await request<{ id: string }[]>('get',
      `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(name)}&limit=1&fields=id`
    )
    if (any.length > 0) {
      existingRecipeId.value = any[0]!.id
      recipeSearchDone.value = true
      return any[0]!.id
    }
  } catch {
    // ignore
  }
  recipeSearchDone.value = true
  return null
}

async function startCooking() {
  if (!cookEntry.value) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'cooking',
    })
    cookEntry.value.status = 'cooking'
    await fetchParticipants()
  } catch (e) {
    console.error('Failed to start cooking:', e)
  }
  saving.value = false
}

async function saveDish() {
  if (!cookEntry.value || !dishName.value.trim()) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      dish_name: dishName.value.trim(),
      category: selectedCategory.value || null,
      status: 'scheduled',
    })
    cookEntry.value.dish_name = dishName.value.trim()
    cookEntry.value.category = selectedCategory.value || null
    cookEntry.value.status = 'scheduled'
    await fetchParticipants()
    await searchExistingRecipe(dishName.value.trim())

    // Fork on cook: if recipe exists and belongs to another user, fork it
    if (existingRecipeId.value && user.value?.id) {
      const original = await request<{ user_created: string }>('get',
        `/items/recipes/${existingRecipeId.value}?fields=user_created`
      )
      if (original.user_created !== user.value.id) {
        // Check for existing fork
        const forks = await request<{ id: string }[]>('get',
          `/items/recipes?filter[forked_from][_eq]=${existingRecipeId.value}&filter[user_created][_eq]=${user.value.id}&limit=1&fields=id`
        )
        if (forks.length > 0) {
          existingRecipeId.value = forks[0]!.id
        } else {
          const originalFull = await request<any>('get',
            `/items/recipes/${existingRecipeId.value}?fields=dish_name,category,description,photo,ingredients,steps`
          )
          const created = await request<{ id: string }>('post', '/items/recipes', {
            dish_name: originalFull.dish_name,
            category: originalFull.category,
            description: originalFull.description,
            photo: originalFull.photo,
            ingredients: originalFull.ingredients,
            steps: originalFull.steps,
            cook: user.value.id,
            forked_from: existingRecipeId.value,
          })
          existingRecipeId.value = created.id
        }
      }
      // User owns the recipe → use as-is; no PATCH needed
    }
  } catch (e) {
    console.error('Failed to save dish:', e)
  }
  saving.value = false
}

function selectPastDish(item: HistoryDish) {
  dishName.value = item.dish_name
  if (item.category) selectedCategory.value = item.category
}

async function saveMatchedDish() {
  if (!cookEntry.value) return
  const recipe = matchedRecipe.value
  if (!recipe) return
  dishName.value = recipe.dish_name
  await saveDish()
}

function createRecipeAndAdd() {
  const returnTo = `/cook?date=${pageDateStr.value}`
  router.push(
    `/recipe/create?name=${encodeURIComponent(dishName.value.trim())}&date=${pageDateStr.value}&category=${selectedCategory.value}&returnTo=${encodeURIComponent(returnTo)}`
  )
}

function editDish() {
  if (!cookEntry.value?.dish_name) return
  const id = existingRecipeId.value
  if (id) {
    router.push(`/recipe/${id}`)
  } else {
    router.push(`/recipe/create?name=${encodeURIComponent(cookEntry.value.dish_name)}&date=${pageDateStr.value}&category=${selectedCategory.value}`)
  }
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
    // TODO: Notify participants that lunch is ready
  } catch (e) {
    console.error('Failed to mark ready:', e)
  }
  saving.value = false
}

async function cancelCooking() {
  if (!cookEntry.value) return
  cancelling.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'cancelled',
    })

    const orders = await request<OrderEntry[]>('get',
      `/items/orders?filter[cook_queue][_eq]=${cookEntry.value.id}&filter[status][_eq]=confirmed&fields=id`
    )
    for (const o of orders) {
      await request('delete', `/items/orders/${o.id}`)
    }

    router.push('/kitchen')
  } catch (e) {
    console.error('Failed to cancel cooking:', e)
  }
  cancelling.value = false
  showCancelDialog.value = false
}

async function loadPastaCost() {
  if (!existingRecipeId.value) {
    pastaCost.value = 0
    pastaBreakdown.value = null
    return
  }
  try {
    const recipe = await request<{ pasta_packages: number | null }>('get',
      `/items/recipes/${existingRecipeId.value}?fields=pasta_packages`
    )
    const packages = recipe.pasta_packages ?? 0
    if (packages > 0) {
      const price = await mealCost.fetchPastaPrice()
      const cost = mealCost.computePastaCost(packages, price)
      pastaCost.value = cost
      pastaBreakdown.value = {
        label: `Pasta (${packages} package${packages > 1 ? 's' : ''})`,
        amount: cost,
      }
    } else {
      pastaCost.value = 0
      pastaBreakdown.value = null
    }
  } catch {
    pastaCost.value = 0
    pastaBreakdown.value = null
  }
}

async function confirmDeduction() {
  if (!cookEntry.value || !receiptAmount.value || participants.value.length === 0) return
  deducting.value = true
  const baseTotal = parseFloat(receiptAmount.value)
  const grandTotal = baseTotal + pastaCost.value
  const share = grandTotal / participants.value.length

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

// ── Refresh when page becomes visible ──
async function refreshCookData() {
  await fetchTodayEntry()
  if (cookEntry.value && !cookEntry.value.dish_name) {
    await fetchPastDishes()
    return
  }
  if (cookEntry.value && cookEntry.value.dish_name) {
    await fetchParticipants()
    await searchExistingRecipe(cookEntry.value.dish_name)
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshCookData()
  }
}

// ── Init ──
watch(existingRecipeId, () => {
  loadPastaCost()
})

onMounted(async () => {
  await refreshCookData()

  // Handle return from recipe/create with a new recipe
  const newRecipeId = route.query.newRecipe as string | undefined
  if (newRecipeId && cookEntry.value && !cookEntry.value.dish_name) {
    try {
      const recipe = await request<{ dish_name: string }>('get',
        `/items/recipes/${newRecipeId}?fields=dish_name`
      )
      dishName.value = recipe.dish_name
      await saveDish()
      await router.replace({ query: { date: pageDateStr.value } })
    } catch {
      // ignore
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
