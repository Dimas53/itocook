/**
 * Map of ingredient names to emoji icons.
 *
 * Keys are lowercase ingredient names (singular/plural). Lookup is
 * case-insensitive and supports substring matching via `getIngredientIcon`.
 *
 * **Used by:** shopping list page to display a visual icon next to each ingredient.
 *
 * **Callers:**
 * - `pages/shopping-list.vue` — ingredient rows
 * - `pages/recipe/[id].vue` — ingredient list
 * - `pages/recipe/create.vue` — ingredient editor
 */
export const INGREDIENT_ICONS: Record<string, string> = {
  'chicken': '🐔',
  'chicken breast': '🐔',
  'chicken fillet': '🐔',
  'chicken thigh': '🐔',
  'turkey': '🦃',
  'beef': '🥩',
  'steak': '🥩',
  'pork': '🐖',
  'bacon': '🥓',
  'ham': '🍖',
  'lamb': '🐑',
  'ground meat': '🥩',
  'minced meat': '🥩',
  'ground beef': '🥩',
  'ground pork': '🥩',
  'sausage': '🌭',
  'sausages': '🌭',
  'meatballs': '🍖',

  'fish': '🐟',
  'salmon': '🐟',
  'tuna': '🐟',
  'shrimp': '🦐',
  'prawns': '🦐',
  'squid': '🦑',
  'seafood': '🦞',

  'egg': '🥚',
  'eggs': '🥚',
  'milk': '🥛',
  'cheese': '🧀',
  'mozzarella': '🧀',
  'parmesan': '🧀',
  'gouda': '🧀',
  'butter': '🧈',
  'cream': '🥛',
  'sour cream': '🥛',
  'yogurt': '🥛',

  'olive oil': '🫒',
  'vegetable oil': '🫗',
  'sunflower oil': '🫗',

  'onion': '🧅',
  'garlic': '🧄',
  'tomato': '🍅',
  'tomatoes': '🍅',
  'cucumber': '🥒',
  'potato': '🥔',
  'potatoes': '🥔',
  'carrot': '🥕',
  'carrots': '🥕',
  'pepper': '🌶️',
  'chili': '🌶️',
  'chili pepper': '🌶️',
  'bell pepper': '🫑',
  'red pepper': '🫑',
  'cabbage': '🥬',
  'lettuce': '🥬',
  'broccoli': '🥦',
  'eggplant': '🍆',
  'aubergine': '🍆',
  'mushroom': '🍄',
  'mushrooms': '🍄',
  'corn': '🌽',
  'pumpkin': '🎃',
  'avocado': '🥑',
  'beans': '🫘',
  'green beans': '🫛',
  'peas': '🫛',
  'ginger': '🫚',
  'leek': '🥬',
  'spinach': '🥬',
  'olives': '🫒',
  'capers': '🫒',
  'lemon zest': '🍋',

  'parsley': '🌿',
  'dill': '🌿',
  'basil': '🌿',
  'cilantro': '🌿',
  'coriander': '🌿',
  'mint': '🍃',
  'rosemary': '🌱',
  'thyme': '🌱',
  'bay leaf': '🍃',
  'salt': '🧂',
  'black pepper': '⚫',
  'paprika powder': '🟠',
  'cinnamon': '🟤',
  'curry powder': '🟡',
  'turmeric': '🟡',
  'vanilla': '🤎',
  'sugar': '🤍',
  'honey': '🍯',

  'rice': '🍚',
  'pasta': '🍝',
  'spaghetti': '🍝',
  'noodles': '🍜',
  'bread': '🍞',
  'baguette': '🥖',
  'flour': '🌾',
  'oats': '🌾',
  'tortilla': '🫓',
  'pita': '🫓',

  'lemon': '🍋',
  'lime': '🍋',
  'apple': '🍎',
  'pear': '🍐',
  'banana': '🍌',
  'orange': '🍊',
  'grapes': '🍇',
  'strawberry': '🍓',
  'coconut': '🥥',

  'water': '🥤',
  'canned tomatoes': '🥫',
  'canned beans': '🥫',
  'tomato paste': '🥫',
  'stock': '🥫',
  'broth': '🥫',
  'vegetable broth': '🥫',
  'soy sauce': '🍶',
  'vinegar': '🍶',
  'wine': '🍷',
}

/**
 * Fallback emoji displayed when no icon matches an ingredient.
 */
export const DEFAULT_INGREDIENT_ICON = '🍽️'

/**
 * Look up the best matching emoji icon for a given ingredient name.
 *
 * **Lookup strategy (in order):**
 *   1. Exact (case-insensitive) match in `INGREDIENT_ICONS`.
 *   2. Longest-key-first substring match — "chicken breast" matches "chicken breast"
 *      before "chicken".
 *   3. Fallback to `DEFAULT_INGREDIENT_ICON` (`🍽️`).
 *
 * **Callers:**
 * - `components/IngredientRow.vue` (if extracted)
 * - Template-level in `pages/shopping-list.vue`
 *
 * **Edge cases:**
 * - Empty/null name → returns default icon immediately.
 * - Whitespace is trimmed before lookup.
 * - Compound ingredient names (e.g. "red pepper") match the longer key
 *   ("red pepper" over "pepper") because keys are sorted by length descending.
 *
 * @param name Raw ingredient name (e.g. "Chicken Breast", "  SALT ").
 * @returns Emoji string or the default fallback.
 */
export function getIngredientIcon(name: string): string {
  if (!name) return DEFAULT_INGREDIENT_ICON
  const normalized = name.trim().toLowerCase()

  if (INGREDIENT_ICONS[normalized]) return INGREDIENT_ICONS[normalized]!

  const keys = Object.keys(INGREDIENT_ICONS).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return INGREDIENT_ICONS[key]!
    }
  }

  return DEFAULT_INGREDIENT_ICON
}
