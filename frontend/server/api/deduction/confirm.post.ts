/**
 * Admin-proxied endpoint that closes a meal's financial cycle.
 * Creates debit transactions and updates balances for each participant,
 * then marks the cook_queue entry as completed.
 * Touches: `transactions`, `balances`, `cook_queue`.
 */
import { defineEventHandler, readBody, createError } from 'h3'

interface DirectusError {
  errors: Array<{ message: string }>
}

interface BalanceEntry {
  id: string
  user: string
  amount: string
}

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const config = useRuntimeConfig(event)
  const { cookQueueId, participants, totalAmount, cookId, description, guests, companyPaysAll } = await readBody(event) as {
    cookQueueId: string
    participants: Array<{ id: string; share: number }>
    totalAmount: number
    cookId: string
    description?: string
    guests?: string[]
    companyPaysAll?: boolean
  }

  if (!cookQueueId || !participants?.length || typeof totalAmount !== 'number' || !cookId) {
    throw createError({ statusCode: 400, message: 'Missing required fields: cookQueueId, participants, totalAmount, cookId' })
  }

  const guestNames = guests ?? []
  const totalParticipants = participants.length + guestNames.length
  const share = totalParticipants > 0 ? totalAmount / totalParticipants : 0

  const adminToken = await getAdminToken(config)

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  }

  const dateStr = new Date().toISOString()

  // Helper: update company account balance (singleton — no ID needed)
  async function updateCompanyBalance(delta: number) {
    const res = await fetch(`${config.directusUrl}/items/company_account`, { headers })
    if (!res.ok) return
    const json = await res.json()
    const currentBalance = parseFloat(json.data?.balance ?? 0)
    await fetch(`${config.directusUrl}/items/company_account`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ balance: currentBalance + delta }),
    })
  }

  if (companyPaysAll) {
    // Company pays the full amount — skip ALL user transactions/balances
    await fetch(`${config.directusUrl}/items/company_transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: -totalAmount,
        description: description || `Company paid: ${cookQueueId}`,
        cook_queue: cookQueueId,
      }),
    }).then(async (r) => {
      if (!r.ok) {
        const err = await r.json() as DirectusError
        throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to create company transaction' })
      }
    })
    await updateCompanyBalance(-totalAmount)

    // Mark queue completed and return early
    const queueRes = await fetch(`${config.directusUrl}/items/cook_queue/${cookQueueId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed' }),
    })
    if (!queueRes.ok) {
      const err = await queueRes.json() as DirectusError
      throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to update cook queue' })
    }
    return { success: true }
  } else {
    // Normal flow: user transactions + guest handling
    await Promise.all(participants.map(p =>
      fetch(`${config.directusUrl}/items/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user: p.id,
          amount: -share,
          type: 'debit',
          description: description || `Lunch deduction`,
          date: dateStr,
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json() as DirectusError
          throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to create transaction' })
        }
      })
    ))

    const ids = participants.map(p => p.id)
    const balanceRes = await fetch(
      `${config.directusUrl}/items/balances?filter[user][_in]=${ids.join(',')}&limit=${ids.length}`,
      { headers }
    )

    if (!balanceRes.ok) {
      const err = await balanceRes.json() as DirectusError
      throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to fetch balances' })
    }

    const balanceJson = await balanceRes.json()
    const allBalances = (balanceJson as { data: BalanceEntry[] }).data ?? []
    const balanceMap = new Map(allBalances.map((b: BalanceEntry) => [b.user, b]))

    await Promise.all(participants.map(p => {
      const existing = balanceMap.get(p.id)
      if (existing) {
        return fetch(`${config.directusUrl}/items/balances/${existing.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ amount: parseFloat(existing.amount) - share }),
        }).then(async (r) => {
          if (!r.ok) {
            const err = await r.json() as DirectusError
            throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to update balance' })
          }
        })
      }
      return fetch(`${config.directusUrl}/items/balances`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user: p.id, amount: -share }),
      }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json() as DirectusError
          throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to create balance' })
        }
      })
    }))

    // Handle guest deductions from company account
    if (guestNames.length > 0) {
      const companyShare = share * guestNames.length

      await Promise.all(
        guestNames.map(name =>
          fetch(`${config.directusUrl}/items/company_transactions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              amount: -share,
              description: `Guest: ${name}`,
              cook_queue: cookQueueId,
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json() as DirectusError
              throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to create company transaction' })
            }
          })
        )
      )

      await updateCompanyBalance(-companyShare)
    }
  }

  const queueRes = await fetch(`${config.directusUrl}/items/cook_queue/${cookQueueId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status: 'completed' }),
  })

  if (!queueRes.ok) {
    const err = await queueRes.json() as DirectusError
    throw createError({ statusCode: 500, message: err.errors?.[0]?.message || 'Failed to update cook queue' })
  }

  return { success: true }
})
