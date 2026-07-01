export function useSwipeDismiss(onClose: () => void) {
  const touchStartY = ref(0)
  const touchDeltaY = ref(0)
  const swiping = ref(false)

  function onTouchStart(e: TouchEvent) {
    e.stopPropagation()
    touchStartY.value = e.touches[0]!.clientY
    swiping.value = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!swiping.value) return
    e.stopPropagation()
    touchDeltaY.value = e.touches[0]!.clientY - touchStartY.value
  }

  function onTouchEnd(e: TouchEvent) {
    if (!swiping.value) return
    e.stopPropagation()
    if (touchDeltaY.value > 80) {
      onClose()
    }
    touchStartY.value = 0
    touchDeltaY.value = 0
    swiping.value = false
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
