<script setup lang="ts">
/**
 * Duty page — month calendar with cleaning assignments, confirmation.
 * Touches: `cleaning_schedule`.
 */

import type { CalendarEntry } from '~/components/MonthCalendar.vue'

interface CleaningEntry {
  id: string
  date: string
  department: string
  confirmed: boolean
  user: {
    id: string
    first_name: string
    last_name: string
  }
}

interface CalendarDay {
  iso: string
  isPast: boolean
  entry: CleaningEntry | null
}

definePageMeta({ layout: 'app' })

const { request } = useDirectus()
const { user } = useAuth()

// ── Today block ──
const loading = ref(true)
const entry = ref<CleaningEntry | null>(null)
const todayISO = new Date().toISOString().split('T')[0]!

// ── Calendar ──
const monthOffset = ref(0)
const monthEntries = ref<CleaningEntry[]>([])
const calLoading = ref(false)
const selectedDay = ref<CalendarDay | null>(null)

const monthDate = computed(() => {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() + monthOffset.value)
  return d
})

function fmtISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthStart(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function monthEnd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return `${y}-${m}-${String(last).padStart(2, '0')}`
}

const calendarEntries = computed<CalendarEntry[]>(() =>
  monthEntries.value.map(e => {
    const isCurrentUser = user.value && e.user.id === user.value.id
    return {
      date: e.date,
      dotColor: e.confirmed ? '#86efac' : '#D2C5FF',
      cellClass: isCurrentUser ? 'bg-primary-pale text-primary font-semibold' : undefined,
    }
  })
)

function onCellTap(iso: string) {
  const calEntry = monthEntries.value.find(e => e.date === iso) ?? null
  if (selectedDay.value?.iso === iso) {
    selectedDay.value = null
    editingDate.value = null
  } else {
    const todayStr = fmtISO(new Date())
    selectedDay.value = { iso, isPast: iso < todayStr, entry: calEntry }
    editingDate.value = null
  }
}

function shiftMonth(delta: number) {
  monthOffset.value += delta
  selectedDay.value = null
}

async function fetchMonth() {
  calLoading.value = true
  try {
    const items = await request<CleaningEntry[]>('get',
      `/items/cleaning_schedule?filter[date][_gte]=${monthStart(monthDate.value)}&filter[date][_lte]=${monthEnd(monthDate.value)}&fields=id,date,department,confirmed,user.id,user.first_name,user.last_name&limit=100`
    )
    monthEntries.value = items ?? []
  } catch {
    monthEntries.value = []
  }
  calLoading.value = false
}

watch(monthDate, fetchMonth)

// ── Today block logic ──
async function confirmDuty() {
  if (!entry.value) return
  await fetch('/api/duty/confirm', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: entry.value.id, confirmed: true }),
  })
  entry.value.confirmed = true
  const calEntry = monthEntries.value.find(e => e.id === entry.value!.id)
  if (calEntry) calEntry.confirmed = true
}

const isCurrentUser = computed(() => {
  if (!entry.value || !user.value) return false
  return entry.value.user.id === user.value.id
})

const fullName = computed(() => {
  if (!entry.value) return ''
  const u = entry.value.user
  return formatUserName(u, '')
})

const selectedEntryName = computed(() => {
  if (!selectedDay.value?.entry) return ''
  const u = selectedDay.value.entry.user
  return formatUserName(u, '')
})

// ── Admin edit mode ──
const USER_ROLE_UUID = '1927ae8a-4442-4097-91ce-0c290b3fc1d4'
const DEPARTMENTS = ['Buchhaltung', 'Vertrieb', 'IT-Security', 'Infrastruktur', 'Entwicklung', 'HR', 'MARKET', 'CONTR']

const isAdmin = computed(() => user.value?.role && user.value.role !== USER_ROLE_UUID)

const editingDate = ref<string | null>(null)
const allUsers = ref<{ id: string; first_name: string; last_name: string; department: string }[]>([])
const editDept = ref('')
const editUserId = ref('')
const editSaving = ref(false)

const filteredUsers = computed(() =>
  allUsers.value.filter(u => u.department === editDept.value)
)

function startEdit() {
  if (!selectedDay.value) return
  editingDate.value = selectedDay.value.iso
  editDept.value = selectedDay.value.entry?.department ?? DEPARTMENTS[0]
  editUserId.value = selectedDay.value.entry?.user.id ?? ''
}

function cancelEdit() {
  editingDate.value = null
}

async function saveAssignment() {
  if (!editingDate.value || !editUserId.value) return
  editSaving.value = true
  try {
    const existing = selectedDay.value?.entry
    await $fetch('/api/duty/upsert', {
      method: 'POST',
      body: {
        id: existing?.id ?? undefined,
        date: editingDate.value,
        user: editUserId.value,
        department: editDept.value,
        confirmed: existing?.confirmed ?? false,
      },
    })
    editingDate.value = null
    selectedDay.value = null
    await fetchMonth()
  } catch {
    // silent
  }
  editSaving.value = false
}

onMounted(async () => {
  try {
    const items = await request<CleaningEntry[]>('get',
      `/items/cleaning_schedule?filter[date][_eq]=${todayISO}&fields=id,date,department,confirmed,user.id,user.first_name,user.last_name&limit=1`
    )
    entry.value = items?.[0] ?? null
  } catch {
    entry.value = null
  }
  loading.value = false
  await fetchMonth()

  if (isAdmin.value) {
    try {
      const res = await $fetch<{ users: { id: string; first_name: string; last_name: string; department: string }[] }>('/api/users/list')
      allUsers.value = res.users ?? []
    } catch {
      allUsers.value = []
    }
  }
})
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center justify-between px-5 pb-4">
      <div>
        <p class="text-[14px] text-gray-500">Cleaning</p>
        <h1 class="text-[20px] font-semibold text-app-black -mt-0.5">Duty Roster</h1>
      </div>
      <NotificationBell />
    </div>

    <div class="px-5 pb-[100px] space-y-5">
      <!-- Today block -->
      <div class="bg-white rounded-2xl px-4 py-4 shadow-sm">
        <div v-if="loading" class="space-y-3">
          <div class="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
          <div class="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
          <div class="h-6 w-36 bg-gray-100 rounded-full animate-pulse mt-1" />
        </div>

        <template v-else-if="entry">
          <p class="text-[11px] text-gray-400 uppercase tracking-wide">On duty today</p>
          <span class="inline-block bg-primary-pale text-primary text-[12px] font-medium rounded-full px-3 py-1 mt-2">
            {{ entry.department }}
          </span>
          <p class="text-[20px] font-semibold text-app-black mt-1">{{ fullName }}</p>

          <button
            v-if="isCurrentUser && !entry.confirmed"
            class="bg-primary text-white h-10 rounded-xl w-full mt-3 text-[14px] font-semibold active:scale-[0.98] transition-transform"
            @click="confirmDuty"
          >
            ✓ Confirm Duty
          </button>

          <div v-else-if="isCurrentUser && entry.confirmed" class="mt-3">
            <span class="inline-block bg-green-pastel text-green-700 text-[14px] font-semibold rounded-xl px-4 py-2 w-full text-center">
              ✓ Confirmed
            </span>
          </div>
        </template>

        <p v-else class="text-[14px] text-gray-400">No duty assigned for today</p>
      </div>

      <!-- Monthly calendar -->
      <div>
        <div v-if="calLoading" class="flex items-center justify-center py-8">
          <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>

        <MonthCalendar
          v-else
          :current-month="monthDate"
          :entries="calendarEntries"
          :selected-date="selectedDay?.iso ?? null"
          @select="onCellTap"
          @prev-month="shiftMonth(-1)"
          @next-month="shiftMonth(1)"
        />

        <!-- Popover -->
        <div
          v-if="selectedDay"
          class="mt-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
        >
          <!-- Edit mode (admin only) -->
          <template v-if="editingDate">
            <p class="text-[11px] text-gray-400 uppercase tracking-wide mb-3">Edit assignment</p>

            <p class="text-[11px] text-gray-400 mb-1">Department</p>
            <select
              v-model="editDept"
              class="bg-primary-pale text-app-black text-[13px] font-medium rounded-xl px-3 py-2 pr-8 border-none outline-none w-full mb-3"
            >
              <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
            </select>

            <p class="text-[11px] text-gray-400 mb-1">User</p>
            <select
              v-model="editUserId"
              class="bg-primary-pale text-app-black text-[13px] font-medium rounded-xl px-3 py-2 pr-8 border-none outline-none w-full mb-3"
            >
              <option value="" disabled>— Select user —</option>
              <option v-for="u in filteredUsers" :key="u.id" :value="u.id">
                {{ u.first_name }} {{ u.last_name }}
              </option>
            </select>

            <div class="flex gap-2">
              <button
                class="flex-1 bg-gray-100 text-gray-500 h-10 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-transform"
                @click="cancelEdit"
              >
                Cancel
              </button>
              <button
                class="flex-1 bg-primary text-white h-10 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-50"
                :disabled="!editUserId || editSaving"
                @click="saveAssignment"
              >
                {{ editSaving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </template>

          <!-- View mode -->
          <template v-else>
            <div class="flex items-center justify-between">
              <div>
                <p v-if="selectedDay.entry" class="text-[14px] font-semibold text-app-black">{{ selectedEntryName }}</p>
                <p v-else class="text-[14px] font-semibold text-app-black">No assignment</p>
                <p class="text-[12px] text-gray-500 mt-0.5">{{ selectedDay.entry?.department ?? '—' }}</p>
              </div>
              <span
                v-if="selectedDay.isPast"
                class="inline-block bg-gray-100 text-gray-400 text-[11px] font-medium rounded-full px-2.5 py-1"
              >
                Done
              </span>
              <span
                v-else-if="selectedDay.entry?.confirmed"
                class="inline-block bg-green-pastel text-green-700 text-[11px] font-semibold rounded-full px-2.5 py-1"
              >
                ✓ Confirmed
              </span>
              <span
                v-else-if="selectedDay.entry"
                class="inline-block bg-gray-100 text-gray-400 text-[11px] font-medium rounded-full px-2.5 py-1"
              >
                Pending
              </span>
            </div>

            <button
              v-if="isAdmin"
              class="bg-primary-pale text-primary h-9 rounded-xl w-full mt-3 text-[13px] font-semibold active:scale-[0.98] transition-transform"
              @click="startEdit"
            >
              {{ selectedDay.entry ? 'Edit' : 'Add' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
