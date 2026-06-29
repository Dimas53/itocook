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
              <div v-if="pastDishes.length === 0" class="text-[13px] text-gray-400 text-center py-6">
                No past dishes yet
              </div>
              <SliderList v-else :items="pastDishes" :visible-count="3" :item-height="60">
                <template #item="{ item }">
                  <div
                    class="rounded-xl bg-white/70 px-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform h-full"
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
                </template>
              </SliderList>
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

          <div
            class="rounded-xl bg-white p-4 flex items-center justify-between"
            :class="{ 'cursor-pointer active:scale-[0.98] transition-transform': existingRecipeId }"
            @click="existingRecipeId && router.push(`/recipe/${existingRecipeId}?cq=${cookEntry!.id}`)"
          >
            <div>
              <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Today's Dish</p>
              <p class="text-[20px] font-bold text-app-black mt-1">{{ cookEntry?.dish_name }}</p>
            </div>
            <button v-if="existingRecipeId" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <PhEye class="w-4 h-4 text-app-black" />
            </button>
          </div>

          <template v-if="recipeSearchDone">
            <button
              v-if="existingRecipeId"
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?id=${existingRecipeId}&name=${encodeURIComponent(cookEntry!.dish_name || '')}&cq=${cookEntry!.id}`)"
            >
              <PhPencil class="w-4 h-4" />
              Edit Recipe
            </button>
            <button
              v-else
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?name=${encodeURIComponent(cookEntry!.dish_name || '')}&date=${pageDateStr}&category=${selectedCategory}&cq=${cookEntry!.id}`)"
            >
              <PhPlus class="w-4 h-4" weight="bold" />
              Add Recipe
            </button>
          </template>

          <button
            class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            :disabled="saving || !isToday"
            @click="startCooking"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
            <PhCookingPot v-else class="w-5 h-5" weight="fill" />
            {{ saving ? 'Starting...' : 'Start Cooking' }}
          </button>
          <p v-if="!isToday" class="text-[12px] text-gray-400 text-center mt-2">Available on {{ formattedDate }}</p>

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
          </div>

          <div
            class="rounded-xl bg-white p-4 flex items-center justify-between"
            :class="{ 'cursor-pointer active:scale-[0.98] transition-transform': existingRecipeId }"
            @click="existingRecipeId && router.push(`/recipe/${existingRecipeId}?cq=${cookEntry!.id}`)"
          >
            <div>
              <p class="text-[12px] text-gray-500 uppercase tracking-wide font-semibold">Today's Dish</p>
              <p class="text-[20px] font-bold text-app-black mt-1">{{ cookEntry?.dish_name }}</p>
            </div>
            <button v-if="existingRecipeId" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <PhEye class="w-4 h-4 text-app-black" />
            </button>
          </div>

          <template v-if="recipeSearchDone">
            <button
              v-if="existingRecipeId"
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?id=${existingRecipeId}&name=${encodeURIComponent(cookEntry!.dish_name || '')}&cq=${cookEntry!.id}`)"
            >
              <PhPencil class="w-4 h-4" />
              Edit Recipe
            </button>
            <button
              v-else
              class="w-full h-12 rounded-full border border-primary text-primary font-semibold text-[14px] flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform"
              @click="router.push(`/recipe/create?name=${encodeURIComponent(cookEntry!.dish_name || '')}&date=${pageDateStr}&category=${selectedCategory}&cq=${cookEntry!.id}`)"
            >
              <PhPlus class="w-4 h-4" weight="bold" />
              Add Recipe
            </button>
          </template>

          <div>
            <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2">
              Participants ({{ pm.participantsList.length }})
            </p>
            <div v-if="pm.participantsList.length === 0" class="rounded-xl bg-white/70 p-4 text-center">
              <PhUsers class="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p class="text-[13px] text-gray-400">No one has joined yet</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="p in pm.participantsList"
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
            class="w-full h-14 rounded-full bg-green-pastel text-app-black font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            :disabled="saving || !isToday"
            @click="markReady"
          >
            <PhSpinner v-if="saving" class="w-5 h-5 animate-spin" />
            <template v-else>
              <PhCheckCircle class="w-5 h-5" weight="fill" />
              Lunch is ready!
            </template>
          </button>
          <p v-if="!isToday" class="text-[12px] text-gray-400 text-center mt-2">Available on {{ formattedDate }}</p>

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

          <div v-if="pm.participantsList.length === 0" class="rounded-xl bg-white/70 p-4 text-center">
            <p class="text-[13px] text-gray-500">No participants to split with</p>
          </div>

          <template v-if="pm.participantsList.length > 0">
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
              <ReceiptSummary
                :pasta-breakdown="deduction.pastaBreakdown"
                :participants-count="pm.participantsList.length"
                :share-per-person="sharePerPerson"
              />
              <hr class="border-gray-100" />
              <div class="flex justify-between text-[14px]">
                <span class="text-gray-500">Total</span>
                <span class="font-bold text-app-black text-[16px]">€{{ grandTotalDisplay }}</span>
              </div>
            </div>

            <div class="rounded-xl bg-yellow-pastel p-4">
              <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Deduction preview</p>
              <template v-if="companyPaysAll">
                <div class="flex justify-between text-[14px] mt-2">
                  <span class="text-app-black">Full amount → Company account</span>
                  <span class="font-medium text-app-black">−€{{ grandTotalDisplay }}</span>
                </div>
              </template>
              <template v-else>
                <div v-for="p in pm.participantsList" :key="p.id" class="flex justify-between text-[14px] mt-2">
                  <span class="text-app-black">{{ p.name }}</span>
                  <span class="font-medium text-app-black">−€{{ sharePerPerson }}</span>
                </div>
                <div v-for="(g, i) in guests" :key="'guest-' + i" class="flex justify-between text-[14px] mt-2">
                  <span class="text-app-black/70 italic">{{ g.trim() || 'Guest ' + (i + 1) }}</span>
                  <span class="font-medium text-app-black/70">−€{{ sharePerPerson }} (Company)</span>
                </div>
              </template>
            </div>

            <!-- Company pays all toggle -->
            <label class="flex items-center justify-between rounded-xl bg-white p-4 border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer">
              <div>
                <p class="text-[13px] font-semibold text-app-black">Company pays all</p>
                <p class="text-[11px] text-gray-400">Charge the full amount to the company account</p>
              </div>
              <div
                class="w-11 h-6 rounded-full transition-colors relative shrink-0 ml-3"
                :class="companyPaysAll ? 'bg-primary' : 'bg-gray-200'"
                @click="companyPaysAll = !companyPaysAll"
              >
                <div
                  class="w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform"
                  :class="companyPaysAll ? 'translate-x-[22px]' : 'translate-x-0.5'"
                />
              </div>
            </label>

            <!-- Guests section (hidden when company pays all) -->
            <div v-if="!companyPaysAll" class="rounded-xl bg-white p-4 space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Guests</p>
                <div class="flex items-center gap-2">
                  <span class="text-[12px] text-gray-500">
                    <PhBuildings class="w-3.5 h-3.5 inline mr-0.5" />
                    Company: €{{ companyBalance.toFixed(2) }}
                  </span>
                </div>
              </div>
              <div v-for="(g, i) in guests" :key="i" class="flex items-center gap-2">
                <input
                  v-model="guests[i]"
                  type="text"
                  placeholder="Guest name"
                  class="flex-1 h-10 rounded-lg bg-gray-50 border border-gray-200 px-3 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
                />
                <span class="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0">Company pays</span>
                <button class="w-8 h-8 flex items-center justify-center shrink-0" @click="removeGuest(i)">
                  <PhTrash class="w-4 h-4 text-red-400" />
                </button>
              </div>
              <button
                class="w-full h-10 rounded-xl border border-dashed border-gray-300 text-[13px] text-gray-500 font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                @click="addGuest"
              >
                <PhUserPlus class="w-4 h-4" />
                Add Guest
              </button>
            </div>

            <button
              class="w-full h-14 rounded-full bg-app-black text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
:disabled="receiptAmount === '' || deduction.deducting"

              @click="handleConfirmDeduction"
            >
              <PhSpinner v-if="deduction.deducting" class="w-5 h-5 animate-spin" />
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
            <p class="text-[24px] font-bold text-app-black mt-1">€{{ deductedTotal.toFixed(2) }}</p>
            <p v-if="deductedCompanyPaysAll" class="text-[13px] text-green-700">Company paid the full amount</p>
            <p v-else class="text-[13px] text-gray-500">{{ pm.participantsList.length }} participants · €{{ (deductedTotal / pm.participantsList.length).toFixed(2) }} each</p>
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

    <ActionBlockedModal
      :show="!!cookBlockedReason"
      :message="cookBlockedReason"
      @close="cookBlockedReason = ''"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Cook Panel — state-machine-driven page for the assigned cook.
 *
 * Route: /cook (with optional ?date=YYYY-MM-DD, ?recipeId=, ?newRecipe=).
 * Guarded by middleware/cook.ts: only a user with a non-cancelled cook_queue
 * entry for today can access. If the page URL has a past date, onMounted
 * redirects to /kitchen.
 *
 * States: assign -> dish -> scheduled -> cooking -> ready -> done.
 * The 'ready' state stays until confirmDeduction succeeds, then flips to 'done'.
 *
 * Key responsibilities:
 *  - Assign current user as cook (with balance gate check)
 *  - Set dish name + category, link to existing recipe or create fork
 *  - Start cooking, mark ready (split from cost entry per Task A')
 *  - Enter receipt with pasta-cost preview and deduction confirmation
 *  - Cancel cooking with cleanup of orders + shopping list
 *  - Sync status on tab visibility change (admin edits from other sessions)
 *
 * Directus collections:
 *  - READ/WRITE: cook_queue, orders, recipes
 *  - READ: balances (via useBalanceCheck)
 *  - WRITE (admin-proxy): balances, transactions (via useDeduction.confirmDeduction)
 */
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
  PhUserPlus,
  PhTrash,
  PhBuildings,
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

/**
 * Cook queue entry returned by Directus.
 * The `cook` field can be a plain UUID string (if not expanded) or
 * an object with user details (if fields=cook.* is specified in the query).
 */
interface CookQueueEntry {
  id: string
  date: string
  dish_name: string | null
  category: string | null
  status: string | null
  cook: string | { id: string; first_name: string; last_name: string; avatar?: string }
  recipe: string | null
}

/**
 * Confirmed order entry. Fetched during cancel to iterate and DELETE
 * each participant's order for the cancelled queue entry.
 */
interface OrderEntry {
  id: string
  user: { id: string; first_name: string; last_name: string }
  status: string
}

/**
 * Past dish shown in the history picker (SliderList).
 * Built from the recipes collection, deduplicated via dedupRecipes(),
 * and enriched with cook name + relative date for display.
 */
interface HistoryDish {
  id: string
  dish_name: string
  category: string | null
  cookName: string
  dateLabel: string
}

/**
 * Date from ?date= query param (e.g. /cook?date=2026-06-18).
 * Falls back to today if param is missing. Used as the source of truth
 * for all date-dependent queries (cook_queue filter, past-date guard).
 */
const pageDateStr = computed(() => {
  return (route.query.date as string) || formatDateISO(new Date())
})

const formattedDate = computed(() => {
  const d = parseISODate(pageDateStr.value)
  return formatDateLong(d)
})

// ── State ──
const loading = ref(true)
const saving = ref(false)
const cancelling = ref(false)
const showCancelDialog = ref(false)
const cookEntry = ref<CookQueueEntry | null>(null)
const dishName = ref('')
const selectedCategory = ref('')
const receiptAmount = ref<string>('')
const pastDishes = ref<HistoryDish[]>([])
const deductionResult = ref(false)
const deductedTotal = ref(0)
const deductedCompanyPaysAll = ref(false)
const guests = ref<string[]>([])
const companyBalance = ref<number>(0)
const companyPaysAll = ref(false)
const cookQueueId = computed(() => cookEntry.value?.id ?? null)
const deduction = reactive(useDeduction())
const pm = reactive(useParticipants(cookQueueId))

const isToday = computed(() => pageDateStr.value === formatDateISO(new Date()))

const CATEGORIES = ['salad', 'soup', 'pasta', 'meat', 'fish', 'dessert', 'pizza', 'other'] as const

/**
 * True when both dish name and category are filled.
 * Enables/disables all schedule/save buttons in the dish state.
 */
const canSchedule = computed(() =>
  dishName.value.trim().length > 0 && !!selectedCategory.value
)

/**
 * Finds a past dish whose name partially matches the current dishName input.
 * Uses case-insensitive .includes() (equivalent to Directus _icontains).
 * Returns null if no match — triggers the "Create Recipe" fallback buttons.
 */
const matchedRecipe = computed(() => {
  if (!dishName.value.trim()) return null
  const name = dishName.value.toLowerCase()
  return pastDishes.value.find(d => d.dish_name.toLowerCase().includes(name)) || null
})

/**
 * Cached recipe ID matching the current dish name.
 * Populated by searchExistingRecipe().
 * - If it points to the user's own recipe: no fork needed.
 * - If it points to another user's recipe: saveDish() will fork it.
 * - null means no existing recipe found; user must create one or save without recipe link.
 */
const existingRecipeId = ref<string | null>(null)
const recipeSearchDone = ref(false)

/**
 * State machine driving the full cook panel UI.
 *
 * Transitions:
 *   loading  → initial fetch in progress (skeleton shown)
 *   assign   → no cook_queue entry exists for this user+date
 *   dish     → entry exists but no dish_name set yet (user must enter name + category)
 *   scheduled → dish + category saved, status='scheduled' (waiting for Start Cooking)
 *   cooking  → status='cooking' (meal in progress, participants visible)
 *   ready    → status='ready' (lunch served, receipt entry form shown)
 *   done     → receipt confirmed (deductionResult=true), summary shown
 *
 * State machine computed — each condition is checked in order.
 * 'ready' requires deductionResult=false (has not completed deduction yet).
 * 'done' requires deductionResult=true (deduction cycle finished).
 */
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

/** Per-person share: (receipt + pasta cost) / total participants (including guests). */
const sharePerPerson = computed(() => {
  const base = parseFloat(receiptAmount.value)
  const totalPeople = pm.participantsList.length + guests.value.length
  if (isNaN(base) || totalPeople === 0) return '0.00'
  const total = base + deduction.pastaCost
  return (total / totalPeople).toFixed(2)
})

/** Grand total = receipt + optional pasta cost. */
const grandTotalDisplay = computed(() => {
  const base = parseFloat(receiptAmount.value)
  const total = (isNaN(base) ? 0 : base) + deduction.pastaCost
  return total.toFixed(2)
})

/**
 * True when today's date is past 14:00 and receipt has not been entered.
 * Triggers the "Cost entry overdue" red badge in the ready state.
 * Cutoff is hardcoded to 14:00 local time on the same day.
 * Only applies to today (isToday check) — future/past dates never show this.
 */
const receiptOverdue = computed(() => {
  if (!isToday) return false
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0)
  return now > cutoff
})

/**
 * Fetch the company account balance from Directus.
 * Used in the ready state to show current company funds for guest payments.
 */
async function fetchCompanyBalance() {
  try {
    const data = await request<{ balance: string }>('GET', '/items/company_account')
    const record = Array.isArray(data) ? data[0] : data
    companyBalance.value = record ? parseFloat(record.balance) : 0
  } catch {
    companyBalance.value = 0
  }
}

/** Add an empty guest row to the guests list. */
function addGuest() {
  guests.value.push('')
}

/** Remove a guest at the given index. */
function removeGuest(index: number) {
  guests.value.splice(index, 1)
}

/**
 * Fetch the cook_queue entry for the current user and the displayed date.
 * Uses the pageDateStr (from ?date= query param or today).
 * Filters out cancelled entries. If found, populates cookEntry ref
 * and pre-fills dishName if one was already saved.
 */
async function fetchTodayEntry() {
  loading.value = true
  try {
    const items = await request<CookQueueEntry[]>('get',
      `/items/cook_queue?filter[date][_eq]=${pageDateStr.value}&filter[cook][_eq]=${user.value?.id}&filter[status][_nin]=cancelled&sort=-date_created&limit=1&fields=*,cook.id,cook.first_name,cook.last_name`
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

/**
 * Fetch the last 200 recipes, deduplicate by dish_name (via dedupRecipes),
 * and populate the history picker (SliderList). Each entry includes the
 * original cook name and a relative date label.
 * Used in the dish state so the cook can pick past dishes to speed up entry.
 */
async function fetchPastDishes() {
  try {
    const items = await request<any[]>('get',
      '/items/recipes?sort=-date_created&limit=200&fields=id,dish_name,category,cook.id,cook.first_name,cook.last_name,date_created,forked_from'
    )
    const deduped = dedupRecipes(items).filter((i: any) => i.dish_name)
    pastDishes.value = deduped.map((r: any) => ({
        id: r.id,
        dish_name: r.dish_name,
        category: r.category ?? null,
        cookName: formatUserName(r.cook),
        dateLabel: formatDateRelative(new Date(r.date_created)),
      }))
  } catch {
    // ignore
  }
}

const cookBlockedReason = ref('')
const recipeIdFromQuery = route.query.recipeId as string | undefined

// ── Actions ──

/**
 * Assign current user as cook for the given date.
 *
 * 1. Checks balance gate (useBalanceCheck — threshold: -30 EUR).
 *    If balance is too low, shows ActionBlockedModal and returns.
 * 2. Creates a cook_queue entry with status='scheduled'.
 * 3. Creates a confirmed order for the cook (auto-join) so the cook
 *    appears in the participant list immediately.
 * 4. Fetches past dishes to populate the history picker.
 *
 * Directus writes: POST /items/cook_queue, POST /items/orders
 */
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

/**
 * Search for an existing recipe by exact dish_name match.
 *
 * Strategy (two-pass):
 *   1. Try user's own recipes first (filter[user_created]).
 *   2. Fallback to any recipe with that name (will be forked in saveDish
 *      if it belongs to another user).
 *
 * Sets existingRecipeId for use by saveDish() and the template (Edit/View buttons).
 * recipeSearchDone flag is set to true regardless of result so the template
 * can show "Edit Recipe" or "Add Recipe" buttons in scheduled/cooking states.
 *
 * @returns The recipe ID or null if no match found
 */
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

/**
 * Transition the cook_queue entry from 'scheduled' to 'cooking'.
 * Called when the cook presses "Start Cooking". After the status update,
 * re-fetches participants (some may have joined since scheduling).
 */
async function startCooking() {
  if (!cookEntry.value) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'cooking',
    })
    cookEntry.value.status = 'cooking'
    await pm.fetch()
  } catch (e) {
    console.error('Failed to start cooking:', e)
  }
  saving.value = false
}

/**
 * Save dish name + category to the queue entry, then optionally fork a recipe.
 *
 * Steps:
 *   1. PATCH the cook_queue entry with dish_name, category, status='scheduled'.
 *   2. Search for an existing recipe matching the dish name.
 *   3. If a recipe exists and belongs to ANOTHER user:
 *      a. Check if a fork already exists for this user (reuse to avoid duplicates).
 *      b. If not, create a fork (copy with forked_from pointing to original).
 *      c. Link the queue entry to the (forked) recipe via PATCH.
 *   4. If the recipe is the user's own, just link it directly (no fork).
 *
 * Fork-on-cook pattern: each cook gets their own copy so they can modify
 * ingredients/steps without affecting the original author's version.
 */
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
    await pm.fetch()
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
      // Link queue entry to the (forked) recipe
      await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
        recipe: existingRecipeId.value,
      })
      cookEntry.value.recipe = existingRecipeId.value
    }
  } catch (e) {
    console.error('Failed to save dish:', e)
  }
  saving.value = false
}

/** Prefill dish name and category from a history selection. */
function selectPastDish(item: HistoryDish) {
  dishName.value = item.dish_name
  if (item.category) selectedCategory.value = item.category
}

/** Save the matched recipe's dish_name + invoke saveDish fork logic. */
async function saveMatchedDish() {
  if (!cookEntry.value) return
  const recipe = matchedRecipe.value
  if (!recipe) return
  dishName.value = recipe.dish_name
  await saveDish()
}

/** Navigate to recipe creation with dish name, date, category pre-filled. */
function createRecipeAndAdd() {
  const returnTo = `/cook?date=${pageDateStr.value}`
  router.push(
    `/recipe/create?name=${encodeURIComponent(dishName.value.trim())}&date=${pageDateStr.value}&category=${selectedCategory.value}&returnTo=${encodeURIComponent(returnTo)}&cq=${cookEntry.value!.id}`
  )
}

/** Navigate to recipe detail (if recipe exists) or create page. */
function editDish() {
  if (!cookEntry.value?.dish_name) return
  const id = existingRecipeId.value
  if (id) {
    router.push(`/recipe/${id}?cq=${cookEntry.value!.id}`)
  } else {
    router.push(`/recipe/create?name=${encodeURIComponent(cookEntry.value.dish_name)}&date=${pageDateStr.value}&category=${selectedCategory.value}`)
  }
}

/**
 * Transition from 'cooking' to 'ready' state.
 * Only sets the status — does NOT trigger deduction. The receipt entry
 * form is shown independently in the 'ready' state (Task A' refactor:
 * split "mark ready" from "confirm deduction").
 * TODO: Notify participants that lunch is ready (future push notification).
 */
async function markReady() {
  if (!cookEntry.value) return
  saving.value = true
  try {
    await request('PATCH', `/items/cook_queue/${cookEntry.value.id}`, {
      status: 'ready',
    })
    cookEntry.value.status = 'ready'
    await pm.fetch()
    // TODO: Notify participants that lunch is ready
  } catch (e) {
    console.error('Failed to mark ready:', e)
  }
  saving.value = false
}

/**
 * Cancel the entire cook entry — full cleanup.
 *
 * 1. PATCH cook_queue to status='cancelled'.
 * 2. Find all confirmed orders for this queue entry and DELETE each.
 * 3. Clean up shopping list items linked to the recipe (via useDeduction).
 * 4. Redirect to /kitchen.
 *
 * Does NOT touch balances or transactions (the meal never happened).
 * Shows a confirmation dialog before executing (showCancelDialog).
 */
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

    await deduction.cleanupShoppingList({
      recipe: cookEntry.value.recipe,
      dishName: cookEntry.value.dish_name,
      cookDate: cookEntry.value.date,
      userId: user.value?.id,
    })

    router.push('/kitchen')
  } catch (e) {
    console.error('Failed to cancel cooking:', e)
  }
  cancelling.value = false
  showCancelDialog.value = false
}

/**
 * Process financial deduction and close the meal cycle.
 *
 * Calls deduction.confirmDeduction() which POSTs to the admin-proxy server
 * route (/api/deduction/confirm). The server route creates transactions
 * and updates balances for each participant using an admin Directus token
 * (avoiding per-user write permissions on balances/transactions).
 *
 * On success:
 *  - Stores the deducted total for the 'done' summary view
 *  - Resets pastaBreakdown and pastaCost (already processed)
 *  - Sets cook_entry status to 'completed' locally
 *  - Sets deductionResult=true which triggers the 'done' state
 */
async function handleConfirmDeduction() {
  if (!cookEntry.value) return
  try {
    await deduction.confirmDeduction({
      cookEntry: cookEntry.value,
      participants: pm.participantsList,
      receiptAmount: receiptAmount.value,
      pastaCost: deduction.pastaCost,
      dateStr: pageDateStr.value,
      userId: user.value?.id,
      guests: guests.value.filter(g => g.trim().length > 0),
      companyPaysAll: companyPaysAll.value,
    })
    deductedTotal.value = parseFloat(receiptAmount.value) + deduction.pastaCost
    deductedCompanyPaysAll.value = companyPaysAll.value
    deduction.pastaBreakdown = null
    deduction.pastaCost = 0
    cookEntry.value.status = 'completed'
    deductionResult.value = true
  } catch (e) {
    console.error('Failed to process deduction:', e)
  }
}

/**
 * Full re-fetch triggered on tab visibility change.
 * Re-fetches queue entry, participants, and recipe search.
 * If no dish_name is set yet, also fetches past dishes (for history picker).
 * This keeps the page in sync with admin-side changes (e.g. admin
 * cancels entry from Directus panel while cook has the page open).
 */
async function refreshCookData() {
  await fetchTodayEntry()
  if (cookEntry.value && !cookEntry.value.dish_name) {
    await fetchPastDishes()
    return
  }
  if (cookEntry.value && cookEntry.value.dish_name) {
    await pm.fetch()
    await searchExistingRecipe(cookEntry.value.dish_name)
  }
}

/** Watch for the 'ready' state to fetch company balance and reset guests. */
watch(state, (s) => {
  if (s === 'ready') {
    fetchCompanyBalance()
  }
  if (s === 'ready' || s === 'done') {
    companyPaysAll.value = false
  }
})

/**
 * visibilitychange handler — re-fetches cook data when the tab becomes visible.
 * Registered in onMounted, cleaned up in onUnmounted.
 * Without this, admin changes (cancel, status update) would only appear
 * on manual page refresh.
 */
function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshCookData()
  }
}

// ── Init ──
/**
 * Watch existingRecipeId — when a recipe is linked/cached, load its
 * pasta package cost for the deduction preview in the 'ready' state.
 * Calls useDeduction.loadPastaCost() which fetches the recipe's
 * pasta_packages field and the app_settings price.
 */
watch(existingRecipeId, () => {
  deduction.loadPastaCost(existingRecipeId.value)
})

/**
 * Page initialisation (runs once on mount).
 *
 * 1. Past-date guard: if ?date= is a past date, redirect to /kitchen.
 *    The cook panel only works for today or future dates.
 * 2. Fetch queue entry, participants, past dishes, recipe search.
 * 3. Handle return from recipe/create with ?newRecipe= param:
 *    fetch the recipe and auto-save as the dish.
 * 4. Handle prefill from ?recipeId= param (navigated from "Cook This"
 *    button on recipe detail): watch for 'dish' state and auto-save.
 * 5. Register visibilitychange listener for status sync.
 */
onMounted(async () => {
  // Past-date guard: redirect to kitchen
  if (pageDateStr.value < formatDateISO(new Date())) {
    await router.replace('/kitchen')
    return
  }

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

  // Prefill from recipeId when entering dish state
  if (recipeIdFromQuery) {
    const prefillWatcher = watch(state, async (s) => {
      if (s === 'dish' && cookEntry.value && !cookEntry.value.dish_name) {
        prefillWatcher()
        try {
          const recipe = await request<{ dish_name: string; category: string | null }>('get',
            `/items/recipes/${recipeIdFromQuery}?fields=dish_name,category`
          )
          dishName.value = recipe.dish_name
          if (recipe.category) selectedCategory.value = recipe.category
          await saveDish()
          await router.replace({ query: { date: pageDateStr.value } })
        } catch {
          // ignore
        }
      }
    })
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
