export function useLikes() {
  const { request } = useDirectus()

  async function fetchLikeCounts(recipeIds: string[]): Promise<Record<string, number>> {
    if (recipeIds.length === 0) return {}
    const likes = await request<{ recipe: string }[]>('get',
      `/items/recipe_likes?fields=recipe&filter[recipe][_in]=${recipeIds.join(',')}&limit=500`
    )
    const countMap: Record<string, number> = {}
    for (const like of likes) {
      countMap[like.recipe] = (countMap[like.recipe] || 0) + 1
    }
    return countMap
  }

  return { fetchLikeCounts }
}
