export interface ParticipantSummary {
  id: string
  name: string
}

export function useParticipants(cookQueueId: Ref<string | null>) {
  const { request } = useDirectus()
  const { user } = useAuth()
  const confirmed = ref(0)
  const hasJoined = ref(false)
  const loading = ref(true)
  const joinBlockedReason = ref('')
  const participantsList = ref<ParticipantSummary[]>([])

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
        name: [o.user.first_name, o.user.last_name].filter(Boolean).join(' ') || 'Unknown',
      }))
    } catch {}
    loading.value = false
  }

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
