/**
 * Static data for the ingredient quick-picker UI.
 * No collections touched — purely frontend data.
 */
import { INGREDIENT_ICONS } from './ingredientIcons'

export interface PopularIngredient {
  name: string
  icon: string
  unit?: string
}

export interface IngredientCategory {
  label: string
  icon: string
  items: PopularIngredient[]
}

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  {
    label: 'Meat & Poultry',
    icon: '🥩',
    items: [
      { name: 'Chicken breast', icon: '🐔', unit: 'g' },
      { name: 'Ground meat', icon: '🥩', unit: 'g' },
      { name: 'Beef', icon: '🥩', unit: 'g' },
      { name: 'Pork', icon: '🐖', unit: 'g' },
      { name: 'Bacon', icon: '🥓', unit: 'g' },
      { name: 'Ham', icon: '🍖', unit: 'g' },
      { name: 'Sausages', icon: '🌭', unit: 'pcs' },
      { name: 'Turkey', icon: '🦃', unit: 'g' },
      { name: 'Lamb', icon: '🐑', unit: 'g' },
    ]
  },
  {
    label: 'Fish & Seafood',
    icon: '🐟',
    items: [
      { name: 'Fish', icon: '🐟', unit: 'g' },
      { name: 'Salmon', icon: '🐟', unit: 'g' },
      { name: 'Tuna', icon: '🐟', unit: 'g' },
      { name: 'Shrimp', icon: '🦐', unit: 'g' },
      { name: 'Squid', icon: '🦑', unit: 'g' },
      { name: 'Seafood', icon: '🦞', unit: 'g' },
    ]
  },
  {
    label: 'Vegetables & Herbs',
    icon: '🥦',
    items: [
      { name: 'Onion', icon: '🧅', unit: 'pcs' },
      { name: 'Garlic', icon: '🧄', unit: 'pcs' },
      { name: 'Tomatoes', icon: '🍅', unit: 'pcs' },
      { name: 'Potatoes', icon: '🥔', unit: 'g' },
      { name: 'Carrots', icon: '🥕', unit: 'pcs' },
      { name: 'Bell pepper', icon: '🫑', unit: 'pcs' },
      { name: 'Cucumber', icon: '🥒', unit: 'pcs' },
      { name: 'Broccoli', icon: '🥦', unit: 'g' },
      { name: 'Mushrooms', icon: '🍄', unit: 'g' },
      { name: 'Cabbage', icon: '🥬', unit: 'g' },
      { name: 'Eggplant', icon: '🍆', unit: 'pcs' },
      { name: 'Avocado', icon: '🥑', unit: 'pcs' },
      { name: 'Parsley', icon: '🌿', unit: 'bunch' },
      { name: 'Dill', icon: '🌿', unit: 'bunch' },
      { name: 'Basil', icon: '🌿', unit: 'bunch' },
    ]
  },
  {
    label: 'Dairy & Eggs',
    icon: '🧀',
    items: [
      { name: 'Eggs', icon: '🥚', unit: 'pcs' },
      { name: 'Milk', icon: '🥛', unit: 'ml' },
      { name: 'Cheese', icon: '🧀', unit: 'g' },
      { name: 'Butter', icon: '🧈', unit: 'g' },
      { name: 'Cream', icon: '🥛', unit: 'ml' },
      { name: 'Sour cream', icon: '🥛', unit: 'ml' },
      { name: 'Yogurt', icon: '🥛', unit: 'ml' },
    ]
  },
  {
    label: 'Pantry & Sauces',
    icon: '🥫',
    items: [
      { name: 'Olive oil', icon: '🫒', unit: 'ml' },
      { name: 'Vegetable oil', icon: '🫗', unit: 'ml' },
      { name: 'Rice', icon: '🍚', unit: 'g' },
      { name: 'Pasta', icon: '🍝', unit: 'g' },
      { name: 'Flour', icon: '🌾', unit: 'g' },
      { name: 'Bread', icon: '🍞', unit: 'pcs' },
      { name: 'Salt', icon: '🧂', unit: 'to taste' },
      { name: 'Black pepper', icon: '⚫', unit: 'to taste' },
      { name: 'Sugar', icon: '🤍', unit: 'g' },
      { name: 'Honey', icon: '🍯', unit: 'g' },
      { name: 'Vegetable broth', icon: '🥫', unit: 'ml' },
      { name: 'Tomato paste', icon: '🥫', unit: 'g' },
      { name: 'Soy sauce', icon: '🍶', unit: 'ml' },
      { name: 'Lemon', icon: '🍋', unit: 'pcs' },
    ]
  },
]

export const POPULAR_INGREDIENTS: PopularIngredient[] = INGREDIENT_CATEGORIES.flatMap(c => c.items)
