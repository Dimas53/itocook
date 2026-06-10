export function useParticipants(cookQueueId: Ref<string | null>) {
  const { request } = useDirectus()
  const { user } = useAuth()
  const confirmed = ref(0)
  const hasJoined = ref(false)
  const loading = ref(true)

  async function fetch() {
    if (!cookQueueId.value) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const orders = await request<any[]>('get',
        `/items/orders?filter[cook_queue][_eq]=${cookQueueId.value}&filter[status][_eq]=confirmed&fields=id,user.id`
      )
      confirmed.value = orders.length
      hasJoined.value = !!user.value && orders.some(o => o.user.id === user.value!.id)
    } catch {}
    loading.value = false
  }

  async function join() {
    if (!cookQueueId.value || hasJoined.value) return
    await request('post', '/items/orders', {
      user: user.value?.id,
      cook_queue: cookQueueId.value,
      status: 'confirmed',
    })
    hasJoined.value = true
    await fetch()
  }

  return { confirmed, hasJoined, loading, fetch, join }
}
