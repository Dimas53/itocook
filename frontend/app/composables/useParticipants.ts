/**
 * A single participant in a meal — their user ID and display name.
 */
export interface ParticipantSummary {
  id: string
  name: string
}

/**
 * useParticipants — composable for meal participant state.
 *
 * Manages the list of users who have joined a specific meal (cook_queue entry),
 * plus the current user's join status. The cook_queue ID is passed as a Ref
 * so it reactively updates when the queue entry is created (e.g. after assigning
 * as cook in cook.vue).
 *
 * Directus collections:
 *  - READ: orders (filtered by cook_queue + status confirmed)
 *  - WRITE: orders (create when user joins)
 *
 * Callers:
 *  - cook.vue — displays participant list and handles deduction
 *  - recipe/[id].vue — shows participant count + join button
 *  - HeroBlock.vue — shows participant count (via useParticipantsModal)
 *
 * IMPORTANT: Returns a PLAIN object with ref properties. Callers in templates
 * MUST wrap with reactive(). Without reactive(), Vue will NOT auto-unwrap refs
 * and v-if="pm.loading" checks the Ref object itself (always truthy).
 *
 * Example (cook.vue): const pm = reactive(useParticipants(cookQueueId))
 *
 * Edge cases:
 *  - If cookQueueId is null (no entry yet), fetch() sets loading=false and returns.
 *  - hasJoined checks two conditions: user must be logged in AND have an order.
 *  - fetch() silently catches errors — participants show as empty on failure.
 *  - join() checks balance gate (-30 EUR threshold) and sets joinBlockedReason
 *    on failure instead of throwing.
 */
export function useParticipants(cookQueueId: Ref<string | null>) {
  const { request } = useDirectus()
  const { user } = useAuth()

  /** Number of confirmed participants for this meal. */
  const confirmed = ref(0)

  /** True if the current user has a confirmed order for this meal. */
  const hasJoined = ref(false)

  /** True while the orders fetch is in progress. */
  const loading = ref(true)

  /**
   * Non-empty when join() was blocked by the balance gate.
   * Displayed via ActionBlockedModal in the calling component.
   */
  const joinBlockedReason = ref('')

  /** List of confirmed participants with their display names. */
  const participantsList = ref<ParticipantSummary[]>([])

  /**
   * Fetch all confirmed orders for the current cook_queue.
   *
   * Populates confirmed count, hasJoined flag, and participantsList.
   * Silently catches errors — if the API is down, participants show as empty.
   * Does nothing if cookQueueId is null (no queue entry yet).
   */
  async function fetch() {
    if (!cookQueueId.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const orders = await request<any[]>('get',
        `/items/orders?filter[cook_queue][_eq]=${cookQueueId.value}&filter[status][_eq]=confirmed&fields=id,user.id,user.first_name,user.last_name`
      )
      confirmed.value = orders.length
      hasJoined.value = !!user.value && orders.some(o => o.user.id === user.value!.id)
      participantsList.value = orders.map((o) => ({
        id: o.user.id,
        name: formatUserName(o.user),
      }))
    } catch {}
    loading.value = false
  }

  /**
   * Join the meal as a participant.
   *
   * 1. Checks balance gate (-30 EUR threshold via useBalanceCheck).
   *    If blocked, sets joinBlockedReason and returns (no throw).
   * 2. Creates a confirmed order in Directus for the current user.
   * 3. Sets hasJoined = true and re-fetches to update the list.
   *
   * Does nothing if cookQueueId is null or user has already joined.
   */
  async function join() {
    if (!cookQueueId.value || hasJoined.value) return
    joinBlockedReason.value = ''

    const { check } = useBalanceCheck()
    const result = await check()
    if (!result.allowed) {
      joinBlockedReason.value = `Your balance is too low (-€${Math.abs(result.balance).toFixed(2)}). Please top up your balance before joining.`
      return
    }

    await request('post', '/items/orders', {
      user: user.value?.id,
      cook_queue: cookQueueId.value,
      status: 'confirmed',
    })
    hasJoined.value = true
    await fetch()
  }

  return { confirmed, hasJoined, loading, joinBlockedReason, participantsList, fetch, join }
}
