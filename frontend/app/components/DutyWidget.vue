<template>
<!--  <div v-if="loading" class="rounded-2xl p-4" style="background: linear-gradient(to bottom, #D2C5FF, #E9D085, #FFDF00)">-->
  <div v-if="loading" class="bg-green-pastel rounded-2xl p-4 relative overflow-hidden">
    <svg
      class="absolute -left-1 -top-1 w-56 h-56 z-0 opacity-10 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
    </svg>
    <div class="h-3 w-20 bg-white/60 rounded-full animate-pulse" />
    <div class="h-5 w-28 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <div
    v-else
    class="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
    :class="isHighlighted ? 'bg-yellow-pastel' : 'bg-green-pastel'"


    @click="$emit('view')"
  >
    <svg
        class="absolute -right-5 -bottom-5 w-20 h-20 z-0 opacity-40 text-secondary"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
    >
      <polygon points="501.539,169.221 453.886,86.7 303.669,173.449 303.669,0 208.365,0 208.365,173.479 58.114,86.73 10.461,169.261 160.674,255.99 10.501,342.71 58.154,425.231 208.365,338.482 208.365,512 303.669,512 303.669,338.542 453.846,425.271 501.499,342.74 351.267,255.99"/>
    </svg>
    <!--    :style="{
      background: isHighlighted
        ? 'linear-gradient(to bottom, #CBFFCF, #A8E890, #7DD87A)'
        : 'linear-gradient(to bottom, #D2C5FF 30%, #E9D085 80%, #FFDF00 100%)'
    }"-->
    <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Next Duty</p>
    <p class="text-[11px] text-gray-500">
      This week: {{ weekDepartment || '—' }}
    </p>
    <p class="text-[14px] font-semibold text-app-black mt-1">
      {{ todayUserName || 'No duty assigned' }}
    </p>
    <p v-if="isMyTurn" class="text-[12px] text-primary font-medium mt-0.5">
      🧹 Your turn today!
    </p>
    <p v-else-if="tomorrowEntry" class="text-[14px] font-semibold text-primary mt-0.5">
      {{ tomorrowUserName }}, You are next!
    </p>
    <p v-else-if="todayEntry" class="text-[12px] text-gray-400 mt-0.5">
      Today, 9:00
    </p>
  </div>
</template>

<script setup lang="ts">
interface CleaningEntry {
  date: string
  department: string
  confirmed: boolean
  user: {
    id: string
    first_name: string
    last_name: string
  }
}

const { request } = useDirectus()
const { user } = useAuth()

const loading = ref(true)
const entries = ref<CleaningEntry[]>([])

const today = new Date()
const todayStr = today.toISOString().split('T')[0]!

function getEndOfWeek(): string {
  const d = new Date(today)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day === 6 ? 5 : 5 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]!
}

const weekDepartment = computed(() => entries.value[0]?.department || null)

const todayEntry = computed(() =>
  entries.value.find((e) => e.date === todayStr) || null
)

const todayUserName = computed(() => {
  const e = todayEntry.value
  if (!e) return null
  return formatUserName(e.user, '')
})

const isMyTurn = computed(() => {
  const e = todayEntry.value
  return e?.user.id === user.value?.id
})

const isHighlighted = computed(() => isMyTurn.value || !!tomorrowEntry.value)

function getTomorrowStr(): string {
  const d = new Date(today)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]!
}

const tomorrowEntry = computed(() =>
  entries.value.find((e) => e.user.id === user.value?.id && e.date === getTomorrowStr()) || null
)

const tomorrowUserName = computed(() => {
  const e = tomorrowEntry.value
  if (!e) return null
  return e.user.first_name
})

async function fetchSchedule() {
  loading.value = true
  try {
    const endOfWeek = getEndOfWeek()
    const items = await request<CleaningEntry[]>('get',
      `/items/cleaning_schedule?filter[date][_gte]=${todayStr}&filter[date][_lte]=${endOfWeek}&fields=date,department,confirmed,user.id,user.first_name,user.last_name&sort[]=date&limit=10`
    )
    entries.value = items ?? []
  } catch {
    entries.value = []
  }
  loading.value = false
}

defineEmits<{ view: [] }>()

onMounted(fetchSchedule)
</script>
