export function useSwipeDismiss(onClose: () => void) {
  const touchStartY = ref(0)
  const touchDeltaY = ref(0)
  const swiping = ref(false)

  function onTouchStart(e: TouchEvent) {
    touchStartY.value = e.touches[0]!.clientY
    swiping.value = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!swiping.value) return
    touchDeltaY.value = e.touches[0]!.clientY - touchStartY.value
  }

  function onTouchEnd() {
    if (!swiping.value) return
    if (touchDeltaY.value > 80) {
      onClose()
    }
    touchStartY.value = 0
    touchDeltaY.value = 0
    swiping.value = false
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
