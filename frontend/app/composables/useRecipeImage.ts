import type { Ref } from 'vue'

export interface RecipeWithImage {
  photo?: string | null
  category?: string | null
}

export interface RecipeImageResult {
  src: string
  isUploaded: boolean
}

const CATEGORY_IMAGES: Record<string, string> = {
  salad: '/images/categories/salad.png',
  soup: '/images/categories/soup.png',
  pasta: '/images/categories/pasta.png',
  meat: '/images/categories/meat.png',
  fish: '/images/categories/fish.png',
  dessert: '/images/categories/dessert.png',
  pizza: '/images/categories/pizza.png',
  other: '/images/categories/other.png',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useRecipeImage(
  source: RecipeWithImage | Ref<RecipeWithImage | null>,
  fallback?: string
) {
  const config = useRuntimeConfig()
  const r = isRef(source) ? source : ref(source) as Ref<RecipeWithImage | null>

  function pickSrc(): string {
    if (fallback) return fallback
    return CATEGORY_IMAGES.other as string
  }

  return computed((): RecipeImageResult => {
    const val = r.value
    const src = pickSrc()
    if (!val) return { src, isUploaded: false }

    if (val.photo) {
      if (UUID_RE.test(val.photo)) {
        const baseUrl = config.public.directusUrl || ''
        return { src: `${baseUrl}/assets/${val.photo}`, isUploaded: true }
      }
      return { src: val.photo, isUploaded: !val.photo.startsWith('/images/') }
    }

    if (val.category && CATEGORY_IMAGES[val.category]) {
      return { src: CATEGORY_IMAGES[val.category]!, isUploaded: false }
    }

    return { src, isUploaded: false }
  })
}
