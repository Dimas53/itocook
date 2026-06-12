export function useBalanceCheck() {
  const { request } = useDirectus()
  const { user } = useAuth()

  const MIN_BALANCE = -30

  async function check(userId?: string): Promise<{ allowed: boolean; balance: number }> {
    const uid = userId || user.value?.id
    if (!uid) return { allowed: true, balance: 0 }
    try {
      const items = await request<{ amount: string }[]>('get', `/items/balances?filter[user][_eq]=${uid}&limit=1`)
      const balance = items[0] ? Number(items[0].amount) : 0
      if (balance < MIN_BALANCE) {
        return { allowed: false, balance }
      }
      return { allowed: true, balance }
    } catch {
      return { allowed: true, balance: 0 }
    }
  }

  return { check, MIN_BALANCE }
}
