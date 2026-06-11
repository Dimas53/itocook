<template>
  <div class="flex flex-col h-full">
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

      <!-- Photo URL -->
      <div>
        <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">Photo URL (optional)</label>
        <input
          v-model="form.photo"
          type="url"
          placeholder="https://example.com/photo.jpg"
          class="w-full h-12 rounded-xl bg-white border border-gray-200 px-4 text-[14px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      <!-- Ingredients -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide">Ingredients</label>
          <button class="text-[12px] text-primary font-semibold flex items-center gap-1 active:scale-[0.98]" @click="addIngredient">
            <PhPlus class="w-3.5 h-3.5" weight="bold" /> Add
          </button>
        </div>
        <div v-for="(ing, i) in form.ingredients" :key="i" class="flex items-center gap-2 mb-2">
          <input
            v-model="ing.name"
            type="text"
            placeholder="Name"
            class="flex-1 h-10 rounded-lg bg-white border border-gray-200 px-3 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary"
          />
          <input
            v-model="ing.amount"
            type="text"
            placeholder="Qty"
            class="w-16 h-10 rounded-lg bg-white border border-gray-200 px-2 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary text-center"
          />
          <input
            v-model="ing.unit"
            type="text"
            placeholder="Unit"
            class="w-16 h-10 rounded-lg bg-white border border-gray-200 px-2 text-[13px] text-app-black placeholder:text-gray-400 focus:outline-none focus:border-primary text-center"
          />
          <button class="w-8 h-8 flex items-center justify-center shrink-0" @click="removeIngredient(i)">
            <PhTrash class="w-4 h-4 text-red-400" />
          </button>
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
        class="w-full h-14 rounded-full bg-primary text-white font-semibold text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        :disabled="!form.dish_name.trim() || submitting || loadingRecipe"
        @click="submitRecipe"
      >
        <PhSpinner v-if="submitting" class="w-5 h-5 animate-spin" />
        <PhCheck v-else class="w-5 h-5" weight="bold" />
        {{ submitting ? 'Saving...' : 'Save Recipe' }}
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhPlus, PhTrash, PhSpinner, PhCheck } from '@phosphor-icons/vue'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()
const { request } = useDirectus()
const { user } = useAuth()

const categories = ['salad', 'soup', 'pasta', 'meat', 'fish', 'dessert', 'other']

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
  ingredients: [] as Ingredient[],
  steps: [] as Step[],
})

const submitting = ref(false)
const loadingRecipe = ref(false)

async function loadRecipe() {
  if (!editingId.value) return
  loadingRecipe.value = true
  try {
    const item = await request<RecipeItem>('get',
      `/items/recipes/${editingId.value}?fields=id,dish_name,category,description,photo,ingredients,steps,cook.id`
    )
    form.dish_name = item.dish_name
    form.category = item.category || ''
    form.description = item.description || ''
    form.photo = item.photo || ''
    if (item.ingredients) {
      const ings = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients
      form.ingredients = Array.isArray(ings) ? ings.map((i: { name?: string; amount?: string; unit?: string }) => ({
        name: i.name || '',
        amount: i.amount || '',
        unit: i.unit || '',
      })) : []
    }
    if (item.steps) {
      const stps = typeof item.steps === 'string' ? JSON.parse(item.steps) : item.steps
      form.steps = Array.isArray(stps) ? stps.map((s: { description?: string }) => ({
        description: s.description || '',
      })) : []
    }
  } catch (e) {
    console.error('Failed to load recipe for editing:', e)
  }
  loadingRecipe.value = false
}

onMounted(() => {
  if (editingId.value) {
    loadRecipe()
  }
})

function addIngredient() {
  form.ingredients.push({ name: '', amount: '', unit: '' })
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
  try {
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

    const payload: Record<string, unknown> = {
      dish_name: form.dish_name.trim(),
      category: form.category || null,
      description: form.description || null,
      photo: form.photo || null,
      ingredients: form.ingredients.length > 0 ? form.ingredients : null,
      steps: form.steps.length > 0 ? form.steps : null,
    }

      if (!isEditing.value) {
        payload.cook = user.value?.id || null
        payload.source_cook_queue = sourceCookQueue
        const created = await request<{ id: string }>('post', '/items/recipes', payload)
        if (user.value?.id) {
          await request('post', '/items/cooked_recipes', {
            recipe: created.id,
            user: user.value.id,
          })
        }
        router.replace(`/recipe/${created.id}`)
      } else {
      const editId = editingId.value!
      await request('PATCH', `/items/recipes/${editId}`, payload)
      router.replace(`/recipe/${editId}`)
    }
  } catch (e) {
    console.error('Failed to save recipe:', e)
  }
  submitting.value = false
}
</script>
