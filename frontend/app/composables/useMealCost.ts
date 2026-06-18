/**
 * useMealCost — composable for meal cost calculations.
 *
 * Currently handles only pasta add-on cost, but designed to be extended
 * for future inventory items. The pasta package price is fetched from the
 * app_settings singleton via a Nuxt admin-proxy server route, not directly
 * from Directus (user tokens don't have read access to app_settings).
 *
 * Directus collections:
 *  - READ (admin-proxy): app_settings -> pasta_package_price
 *
 * Callers:
 *  - useDeduction.loadPastaCost() — fetches price and computes cost
 *
 * Edge cases:
 *  - fetchPastaPrice() uses direct fetch() (not useDirectus.request()) because
 *    it goes through a Nuxt server route (/api/settings/pasta-price), not Directus.
 *  - Falls back to 1.00 EUR on any error — the app should never crash because
 *    the pasta price is unavailable.
 *  - pastaPackagePrice ref caches the fetched price so repeated calls to
 *    computePastaCost don't refetch.
 *  - computePastaCost() handles null/undefined/0 pastaPackages — returns 0.
 */
export function useMealCost() {
  /** Cached pasta package price from app_settings. Defaults to 1.00 EUR. */
  const pastaPackagePrice = ref(1.00)

  /**
   * Fetch the pasta package price from the admin-proxy server route.
   *
   * GET /api/settings/pasta-price -> Nuxt server route -> Directus Admin API.
   * Caches the result in pastaPackagePrice ref.
   *
   * @returns The price per pasta package (default 1.00 on failure)
   */
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

  /**
   * Compute the total cost of pasta packages.
   * Pure function — no side effects.
   *
   * @param pastaPackages - Number of packages (nullable)
   * @param packagePrice - Price per package
   * @returns Total cost (pastaPackages * packagePrice), or 0 if no packages
   */
  function computePastaCost(pastaPackages: number | null | undefined, packagePrice: number): number {
    if (!pastaPackages || pastaPackages <= 0) return 0
    return pastaPackages * packagePrice
  }

  return { pastaPackagePrice, fetchPastaPrice, computePastaCost }
}
