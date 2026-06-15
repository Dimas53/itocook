<template>
  <div v-if="loading" class="bg-green-pastel rounded-2xl p-4">
    <div class="h-3 w-20 bg-white/60 rounded-full animate-pulse" />
    <div class="h-5 w-28 bg-white/60 rounded-full animate-pulse mt-2" />
  </div>

  <div
    v-else
    class="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
    :class="isHighlighted ? 'bg-primary-pale' : 'bg-green-pastel'"
    @click="$emit('view')"
  >
    <p class="text-[12px] text-app-black/60 font-medium uppercase tracking-wide">Next Duty</p>
    <p
      v-if="hasUpcomingDuty"
      class="text-[11px] font-semibold text-primary"
    >
      You're next!
    </p>
    <p v-else class="text-[11px] text-gray-500">
      This week: {{ weekDepartment || '—' }}
    </p>
    <p class="text-[14px] font-semibold text-app-black mt-1">
      {{ todayUserName || 'No duty assigned' }}
    </p>
    <p v-if="isMyTurn" class="text-[12px] text-primary font-medium mt-0.5">
      🧹 Your turn today!
    </p>
    <p v-else-if="todayEntry" class="text-[12px] text-gray-400 mt-0.5">
      Today, 12:00
    </p>
    <p v-else-if="nextDutyDay" class="text-[12px] text-gray-400 mt-0.5">
      Your next duty: {{ nextDutyDay }}
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
  return [e.user.first_name, e.user.last_name].filter(Boolean).join(' ')
})

const isMyTurn = computed(() => {
  const e = todayEntry.value
  return e?.user.id === user.value?.id
})

const hasUpcomingDuty = computed(() =>
  entries.value.some((e) => e.user.id === user.value?.id && e.date > todayStr)
)

const isHighlighted = computed(() => isMyTurn.value || hasUpcomingDuty.value)

const nextDutyDay = computed(() => {
  const myEntries = entries.value.filter((e) => e.user.id === user.value?.id && e.date > todayStr)
  if (myEntries.length === 0) return null
  const d = new Date(myEntries[0]!.date + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
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
