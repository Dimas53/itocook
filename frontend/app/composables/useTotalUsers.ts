export function useTotalUsers() {
  const count = ref(0)
  const loading = ref(true)

  async function fetchCount() {
    loading.value = true
    try {
      const res = await fetch('/api/users/count')
      const data = await res.json()
      count.value = data.count ?? 0
    } catch {
      count.value = 0
    }
    loading.value = false
  }

  fetchCount()

  return { count, loading, fetch: fetchCount }
}
