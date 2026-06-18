/**
 * useBalanceCheck — composable for the balance gate restriction.
 *
 * Prevents a user from becoming cook or joining a meal when their balance
 * drops below the threshold of -30 EUR. The threshold is hardcoded as
 * MIN_BALANCE and also exported for any UI that wants to display it.
 *
 * Directus collections:
 *  - READ: balances (filtered by user, returns amount field)
 *
 * Callers:
 *  - cook.vue assignAsCook() — blocks cook assignment if balance too low
 *  - useParticipants.join() — blocks join if balance too low
 *
 * Edge cases:
 *  - If the user has no balance record yet (first use), returns balance=0 (allowed).
 *  - If the API call fails, returns { allowed: true, balance: 0 } — network errors
 *    never block the user from cooking or joining.
 *  - If no userId is provided and user is not logged in, returns allowed=true.
 *  - Balance is stored as a string in Directus (decimal type), parsed via Number().
 *  - The check function accepts an optional userId to check any user's balance
 *    (used by admin pages or future extensions), but defaults to the current user.
 */
export function useBalanceCheck() {
  const { request } = useDirectus()
  const { user } = useAuth()

  /** Minimum allowed balance threshold in EUR. Balance below this blocks cook/join. */
  const MIN_BALANCE = -30

  /**
   * Check if the user's balance allows them to cook or join a meal.
   *
   * @param userId - Optional user ID to check. Defaults to current user if omitted.
   * @returns { allowed: boolean, balance: number }
   *   allowed: true if balance >= MIN_BALANCE, false otherwise.
   *   balance: the user's current balance (0 if no record or error).
   */
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
