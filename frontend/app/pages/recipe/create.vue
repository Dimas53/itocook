<template>
  <div class="flex flex-col h-full relative">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 pt-[60px] pb-4 bg-white">
      <button class="w-10 h-10 flex items-center justify-center" @click="router.back()">
        <PhCaretLeft class="w-5 h-5 text-app-black" weight="bold" />
      </button>
      <h1 class="text-[18px] font-bold text-app-black">{{ isEditing ? 'Edit Recipe' : 'New Recipe' }}</h1>
      <div class="w-10" />
    </div>

    <!-- Scrollable form -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pb-8 space-y-5">

      <!-- Dish name -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">Dish Name</label>
        <input
          v-model="form.dish_name"
          type="text"
          placeholder="Enter dish name..."
          class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Category -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">Category</label>
        <select
          v-model="form.category"
          class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black focus:outline-none focus:border-primary appearance-none"
        >
          <option value="" disabled>Select category</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c.charAt(0).toUpperCase() + c.slice(1) }}</option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">Description</label>
        <textarea
          v-model="form.description"
          rows="4"
          placeholder="Describe the dish..."
          class="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <!-- Base Servings -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">Base Servings</label>
        <input
          v-model.number="form.servings"
          type="number"
          min="1"
          max="100"
          placeholder="4"
          class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
        <p class="text-[11px] text-gray-400 mt-1">Enter the number of people this recipe is designed for. Ingredients will be scaled from this amount.</p>
      </div>

      <!-- Photo upload -->
      <RecipeImageUpload
        :photo="form.photo"
        @selected="(file: File) => { pendingPhotoFile = file }"
        @cleared="onPhotoCleared"
      />

      <!-- Pasta packages -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">
          Pasta packages (optional)
        </label>
        <input
          v-model.number="form.pasta_packages"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
        <p class="text-[11px] text-gray-400 mt-1">1 package = 500g. 0 or empty = not used.</p>
      </div>

      <!-- Ingredients -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Ingredients</label>
          <button class="text-[12px] text-primary font-semibold flex items-center gap-1 active:scale-[0.98]" @click="showAddPopover = true">
            <PhPlus class="w-3.5 h-3.5" weight="bold" /> Add
          </button>
        </div>
        <div class="w-full overflow-hidden">
          <div v-for="(ing, i) in form.ingredients" :key="i" class="flex items-center gap-2 mb-2 w-full">
            <span class="w-8 shrink-0 text-center text-lg">{{ getIngredientIcon(ing.name) }}</span>
            <input
              v-model="ing.name"
              type="text"
              placeholder="Name"
              class="flex-1 min-w-0 h-10 rounded-lg bg-white border border-gray-200 px-3 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
            />
            <input
              v-model="ing.amount"
              type="text"
              placeholder="Qty"
              class="w-16 shrink-0 h-10 rounded-lg bg-white border border-gray-200 px-2 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary text-center"
            />
            <select
              v-model="ing.unit"
              class="w-20 shrink-0 h-10 rounded-lg bg-white border border-gray-200 px-1 text-[13px] text-app-black text-center focus:outline-none focus:border-primary appearance-none"
            >
              <option value=""></option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="pcs">pcs</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="bunch">bunch</option>
                <option value="to taste">to taste</option>
                <option value="package">package</option>
                <option v-if="ing.unit && !['g','kg','ml','l','pcs','tbsp','tsp','bunch','to taste','package',''].includes(ing.unit)" :value="ing.unit">{{ ing.unit }}</option>
            </select>
            <button class="w-8 shrink-0 h-8 flex items-center justify-center" @click="removeIngredient(i)">
              <PhTrash class="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
        <p v-if="form.ingredients.length === 0" class="text-[12px] text-gray-400 italic">No ingredients added</p>
      </div>

      <!-- Steps -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Steps</label>
          <button class="text-[12px] text-primary font-semibold flex items-center gap-1 active:scale-[0.98]" @click="addStep">
            <PhPlus class="w-3.5 h-3.5" weight="bold" /> Add
          </button>
        </div>
        <div v-for="(step, i) in form.steps" :key="i" class="flex gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0 mt-1">
            <span class="text-[12px] font-bold text-primary">{{ i + 1 }}</span>
          </div>
          <div class="flex-1 flex gap-2">
            <textarea
              v-model="step.description"
              rows="2"
              placeholder="Describe this step..."
              class="flex-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary resize-none"
            />
            <button class="w-8 h-8 flex items-center justify-center shrink-0 mt-1" @click="removeStep(i)">
              <PhTrash class="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
        <p v-if="form.steps.length === 0" class="text-[12px] text-gray-400 italic">No steps added</p>
      </div>

      <!-- Submit -->
      <button
        class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!form.dish_name.trim() || !form.category || submitting || loadingRecipe"
        @click="submitRecipe"
      >
        <PhSpinner v-if="submitting" class="w-5 h-5 animate-spin" />
        <PhCheck v-else class="w-5 h-5" weight="bold" />
        {{ submitting ? 'Saving...' : 'Save Recipe' }}
      </button>

    </div>

    <AddIngredientPopover
      :show="showAddPopover"
      :existing-ingredients="form.ingredients.map(i => i.name.toLowerCase())"
      @close="showAddPopover = false"
      @select="onSelectPopularIngredient"
      @custom="addIngredient"
    />
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhPlus, PhTrash, PhSpinner, PhCheck } from '@phosphor-icons/vue'
import { getIngredientIcon } from '~/utils/ingredientIcons'
import type { PopularIngredient } from '~/utils/popularIngredients'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()
const { request, uploadFile, deleteFile } = useDirectus()
const { user } = useAuth()

const categories = ['salad', 'soup', 'pasta', 'meat', 'fish', 'dessert', 'pizza', 'other']

/**
 * Recipe create/edit page — form with name, category, ingredients, steps, photo upload.
 * Touches: `recipes`, `directus_files`.
 */
interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Step {
  description: string
}

interface RecipeItem {
  id: string
  dish_name: string
  category: string | null
  description: string | null
  photo: string | null
  pasta_packages: number | null
  servings: number | null
  ingredients: { name: string; amount: string; unit: string }[] | string | null
  steps: { step: number; description: string }[] | string | null
  cook: string | { id: string }
}

const editingId = computed(() => route.query.id as string | undefined)
const isEditing = computed(() => !!editingId.value)

const form = reactive({
  dish_name: (route.query.name as string) || '',
  category: (route.query.category as string) || '',
  description: '',
  photo: '',
  pasta_packages: null as number | null,
  servings: 4,
  ingredients: [] as Ingredient[],
  steps: [] as Step[],
})

const submitting = ref(false)
const showAddPopover = ref(false)
const loadingRecipe = ref(false)
const pendingPhotoFile = ref<File | null>(null)
const originalPhoto = ref<string | null>(null)
const FOLDER_ID = 'eb01b9c5-b408-40f9-86fd-c8f2045e258d'

function syncPastaToIngredients() {
  const count = form.pasta_packages ?? 0
  const idx = form.ingredients.findIndex(i => i.name.trim().toLowerCase() === 'pasta')
  if (count > 0) {
    const entry = { name: 'Pasta', amount: String(count), unit: 'package' as const }
    if (idx >= 0) {
      form.ingredients[idx] = entry
    } else {
      form.ingredients.push(entry)
    }
  } else if (idx >= 0) {
    form.ingredients.splice(idx, 1)
  }
}

watch(() => form.pasta_packages, syncPastaToIngredients)

async function loadRecipe() {
  if (!editingId.value) return
  loadingRecipe.value = true
  try {
    const item = await request<RecipeItem>('get',
      `/items/recipes/${editingId.value}?fields=id,dish_name,category,description,photo,pasta_packages,servings,ingredients,steps,cook.id`
    )
    form.dish_name = item.dish_name
    form.category = item.category || ''
    form.description = item.description || ''
    form.photo = item.photo || ''
    originalPhoto.value = item.photo || null
    form.pasta_packages = item.pasta_packages ?? null
    form.servings = item.servings ?? 4
    if (item.ingredients) {
      const ings = parseJsonField(item.ingredients)
      form.ingredients = Array.isArray(ings) ? ings.map((i: { name?: string; amount?: string; unit?: string }) => ({
        name: i.name || '',
        amount: i.amount || '',
        unit: i.unit || '',
      })) : []
    }
    syncPastaToIngredients()
    if (item.steps) {
      const stps = parseJsonField(item.steps)
      form.steps = Array.isArray(stps) ? stps.map((s: { description?: string }) => ({
        description: s.description || '',
      })) : []
    }
  } catch (e) {
    console.error('Failed to load recipe for editing:', e)
  }
  loadingRecipe.value = false
}

async function loadRecipeFromHistory() {
  const name = route.query.name as string
  if (!name) return
  loadingRecipe.value = true
  try {
    const items = await request<RecipeItem[]>('get',
      `/items/recipes?filter[dish_name][_eq]=${encodeURIComponent(name)}&limit=1&fields=id,dish_name,category,description,photo,pasta_packages,servings,ingredients,steps`
    )
    if (items.length > 0) {
      const item = items[0]!
      form.description = item.description || ''
      form.photo = item.photo || ''
      originalPhoto.value = item.photo || null
      form.servings = item.servings ?? 4
      form.pasta_packages = item.pasta_packages ?? null
      if (item.ingredients) {
        const ings = parseJsonField(item.ingredients)
        form.ingredients = Array.isArray(ings) ? ings.map((i: Ingredient) => ({
          name: i.name || '',
          amount: i.amount || '',
          unit: i.unit || '',
        })) : []
      }
      syncPastaToIngredients()
      if (item.steps) {
        const stps = parseJsonField(item.steps)
        form.steps = Array.isArray(stps) ? stps.map((s: { description?: string }) => ({
          description: s.description || '',
        })) : []
      }
    }
  } catch (e) {
    console.error('Failed to load recipe from history:', e)
  }
  loadingRecipe.value = false
}

onMounted(async () => {
  if (editingId.value) {
    await loadRecipe()
  } else if (route.query.name) {
    await loadRecipeFromHistory()
  }
})

function onPhotoCleared() {
  pendingPhotoFile.value = null
  form.photo = ''
}

function addIngredient() {
  form.ingredients.push({ name: '', amount: '', unit: '' })
}

function onSelectPopularIngredient(ing: PopularIngredient) {
  form.ingredients.push({ name: ing.name, amount: '', unit: ing.unit || '' })
}

function removeIngredient(index: number) {
  form.ingredients.splice(index, 1)
}

function addStep() {
  form.steps.push({ description: '' })
}

function removeStep(index: number) {
  form.steps.splice(index, 1)
}

async function submitRecipe() {
  if (!form.dish_name.trim() || submitting.value) return
  submitting.value = true
  let uploadedFileId: string | null = null
  try {
    // Upload photo first if a new file was selected
    if (pendingPhotoFile.value) {
      const result = await uploadFile(pendingPhotoFile.value, FOLDER_ID)
      form.photo = result.id
      uploadedFileId = result.id
      pendingPhotoFile.value = null
    }

    const dateParam = route.query.date as string | undefined
    let sourceCookQueue: string | null = null
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && user.value) {
      try {
        const entries = await request<{ id: string }[]>('get',
          `/items/cook_queue?filter[date][_eq]=${dateParam}&filter[cook][_eq]=${user.value.id}&filter[dish_name][_eq]=${encodeURIComponent(form.dish_name.trim())}&limit=1&fields=id`
        )
        if (entries.length > 0) {
          sourceCookQueue = entries[0]!.id
        }
      } catch {
        // ignore
      }
    }

    syncPastaToIngredients()
    const payload: Record<string, unknown> = {
      dish_name: form.dish_name.trim(),
      category: form.category || null,
      description: form.description || null,
      photo: form.photo || null,
      pasta_packages: form.pasta_packages ?? null,
      servings: form.servings,
      ingredients: form.ingredients.length > 0 ? form.ingredients : null,
      steps: form.steps.length > 0 ? form.steps : null,
    }

      if (!isEditing.value) {
        payload.cook = user.value?.id || null
        payload.source_cook_queue = sourceCookQueue
        const created = await request<{ id: string }>('post', '/items/recipes', payload)
        const returnTo = route.query.returnTo as string | undefined
        if (returnTo) {
          const sep = returnTo.includes('?') ? '&' : '?'
          router.replace(`${returnTo}${sep}newRecipe=${created.id}`)
        } else {
          router.replace(`/recipe/${created.id}`)
        }
      } else {
      const editId = editingId.value!
      await request('PATCH', `/items/recipes/${editId}`, payload)

      // If the photo was replaced or cleared, delete the old file
      if (originalPhoto.value && form.photo !== originalPhoto.value) {
        deleteFile(originalPhoto.value).catch(() => {})
      }

      router.replace(`/recipe/${editId}`)
    }
  } catch (e) {
    console.error('Failed to save recipe:', e)
    // Clean up just-uploaded file if the recipe save failed
    if (uploadedFileId) {
      deleteFile(uploadedFileId).catch(() => {})
    }
  }
  submitting.value = false
}
</script>
