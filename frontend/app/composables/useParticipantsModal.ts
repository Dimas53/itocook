import { ref } from 'vue'

const show = ref(false)
const participants = ref<Array<{ id: string; first_name?: string; last_name?: string; email?: string }>>([])
const loading = ref(false)

export function useParticipantsModal() {
  // Capture useDirectus() at composable init time (component setup)
  // so Nuxt context (useRuntimeConfig, useCookie) is captured in the right scope
  const { request } = useDirectus()

  async function open(queueId: string | undefined) {
    console.log('[ParticipantsModal] open with queueId:', queueId)

    show.value = true

    if (!queueId) {
      console.log('[ParticipantsModal] no queueId — show empty')
      participants.value = []
      loading.value = false
      return
    }

    participants.value = []
    loading.value = true

    const timeoutId = setTimeout(() => {
      console.log('[ParticipantsModal] 5s timeout — force stop loading')
      loading.value = false
    }, 5000)

    try {
      console.log('[ParticipantsModal] fetching orders...')
      const orders = await request<any[]>('get',
        `/items/orders?filter[cook_queue][_eq]=${queueId}`
        + `&filter[status][_eq]=confirmed`
        + `&fields=user.id,user.first_name,user.last_name,user.email`
        + `&limit=100`
      )
      console.log('[ParticipantsModal] response:', orders)
      participants.value = orders.map((o: any) => o.user).filter(Boolean)
    } catch (e: any) {
      console.log('[ParticipantsModal] error:', e?.message ?? e)
      participants.value = []
    }

    clearTimeout(timeoutId)
    loading.value = false
  }

  function close() {
    show.value = false
  }

  return { show, participants, loading, open, close }
}
