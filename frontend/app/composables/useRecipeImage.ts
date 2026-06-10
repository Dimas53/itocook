import type { Ref } from 'vue'

export interface RecipeWithImage {
  photo?: string | null
  category?: string | null
}

const CATEGORY_IMAGES: Record<string, string> = {
  salad: '/images/categories/salad.png',
  soup: '/images/categories/soup.png',
  pasta: '/images/categories/pasta.png',
  meat: '/images/categories/meat.png',
  fish: '/images/categories/fish.png',
  dessert: '/images/categories/dessert.png',
  other: '/images/categories/other.png',
}

export function useRecipeImage(source: RecipeWithImage | Ref<RecipeWithImage | null>) {
  const r = isRef(source) ? source : ref(source) as Ref<RecipeWithImage | null>
  return computed(() => {
    const val = r.value
    if (!val) return CATEGORY_IMAGES.other
    if (val.photo) return val.photo
    if (val.category && CATEGORY_IMAGES[val.category]) return CATEGORY_IMAGES[val.category]
    return CATEGORY_IMAGES.other
  })
}
