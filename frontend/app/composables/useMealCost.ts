export function useMealCost() {
  const pastaPackagePrice = ref(1.00)

  async function fetchPastaPrice(): Promise<number> {
    try {
      const res = await fetch('/api/settings/pasta-price')
      const data = await res.json()
      pastaPackagePrice.value = data.price ?? 1.00
      return pastaPackagePrice.value
    } catch {
      return 1.00
    }
  }

  function computePastaCost(pastaPackages: number | null | undefined, packagePrice: number): number {
    if (!pastaPackages || pastaPackages <= 0) return 0
    return pastaPackages * packagePrice
  }

  return { pastaPackagePrice, fetchPastaPrice, computePastaCost }
}
