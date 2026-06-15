<template>
  <div>
    <div v-if="title" class="text-[14px] font-semibold text-app-black mb-2">
      {{ title }}
    </div>

    <div v-if="items.length > visibleCount" class="flex justify-center h-6">
      <button
        class="w-6 h-6 flex items-center justify-center transition-colors"
        :class="canScrollUp ? 'text-gray-400 active:text-app-black' : 'text-gray-200'"
        :disabled="!canScrollUp"
        @click="scrollUp"
      >
        <PhCaretUp class="w-4 h-4" weight="bold" />
      </button>
    </div>

    <div @touchstart="onTouchStart" @touchend="onTouchEnd">
      <div class="overflow-hidden relative" :style="{ height: sliderHeight + 'px' }">
        <div
          class="transition-transform duration-300 ease-out will-change-transform"
          :style="{ transform: `translateY(${-offset * itemOffset}px)` }"
        >
          <div
            v-for="(item, i) in items"
            :key="i"
            :style="{ height: itemHeight + 'px', marginBottom: (i < items.length - 1 ? itemGap : 0) + 'px' }"
          >
            <slot name="item" :item="item" :index="i" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="items.length > visibleCount" class="flex justify-center h-6">
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
</template>

<script setup lang="ts">
import { PhCaretUp, PhCaretDown } from '@phosphor-icons/vue'

const props = withDefaults(defineProps<{
  items: any[]
  visibleCount?: number
  title?: string
  itemHeight?: number
  itemGap?: number
}>(), {
  visibleCount: 5,
  itemHeight: 60,
  itemGap: 8,
})

const offset = ref(0)
const itemOffset = computed(() => props.itemHeight + props.itemGap)
const sliderHeight = computed(() => props.visibleCount * props.itemHeight + (props.visibleCount - 1) * props.itemGap)

const canScrollUp = computed(() => offset.value > 0)
const canScrollDown = computed(() => offset.value + props.visibleCount < props.items.length)

function scrollUp() {
  if (canScrollUp.value) offset.value--
}

function scrollDown() {
  if (canScrollDown.value) offset.value++
}

let touchStartY = 0

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

watch(() => props.items, () => {
  offset.value = 0
})
</script>
