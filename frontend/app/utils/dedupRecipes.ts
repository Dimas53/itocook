export interface DedupItem {
  id: string
  dish_name: string
  forked_from: string | null
  date_created: string
}

export function dedupRecipes<T extends DedupItem>(recipes: T[]): T[] {
  const groups = new Map<string, T[]>()
  for (const r of recipes) {
    if (!r.dish_name) continue
    const existing = groups.get(r.dish_name) ?? []
    existing.push(r)
    groups.set(r.dish_name, existing)
  }
  const result: T[] = []
  for (const group of groups.values()) {
    const forks = group.filter(r => r.forked_from)
    if (forks.length > 0) {
      forks.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      result.push(forks[0]!)
    } else {
      group.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
      result.push(group[0]!)
    }
  }
  return result
}
