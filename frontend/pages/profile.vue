<template>
  <div class="flex flex-col min-h-full">
    <div class="flex items-center justify-between px-5 pb-5">
      <button @click="router.back()" class="w-10 h-10 flex items-center justify-center">
        <PhCaretLeft class="w-6 h-6 text-app-black" />
      </button>
      <h1 class="text-[20px] font-semibold text-app-black">Profile</h1>
      <button class="w-10 h-10 flex items-center justify-center">
        <PhGear class="w-6 h-6 text-app-black" />
      </button>
    </div>

    <div class="px-5 pb-6">
      <div class="flex items-center gap-4">
        <img
          :src="avatarUrl"
          alt="avatar"
          class="w-20 h-20 rounded-full bg-primary ring-2 ring-primary"
        />
        <div class="flex-1">
          <p class="text-[18px] font-medium text-app-black">
            {{ displayName }}
          </p>
          <p class="text-[14px] text-gray-500 mt-0.5">
            {{ user?.email }}
          </p>
        </div>
        <button class="px-5 h-10 rounded-full border border-gray-200 bg-white text-app-black font-medium text-[14px]">
          Edit
        </button>
      </div>
    </div>

    <div class="px-5 pb-5">
      <div class="flex items-center justify-between bg-primary-pale rounded-2xl px-5 py-4">
        <div>
          <p class="text-[16px] font-medium text-app-black">Preferences</p>
          <p class="text-[12px] text-gray-500 mt-0.5">Goals, food preferences and more</p>
        </div>
        <PhCaretRight class="w-5 h-5 text-gray-400" />
      </div>
    </div>

    <div class="px-5 pb-5">
      <div class="flex gap-2 bg-white rounded-full p-1.5 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="[
            'px-4 h-9 rounded-full text-[14px] font-medium transition-colors',
            activeTab === tab
              ? 'bg-primary text-white'
              : 'text-gray-500'
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <div class="px-5 pb-4">
      <button class="w-full h-14 rounded-2xl bg-primary text-white font-semibold text-[16px]">
        + Create New List
      </button>
    </div>

    <div class="px-5 flex-1">
      <div class="space-y-4">
        <div
          v-for="list in fakeLists"
          :key="list.title"
          class="rounded-2xl overflow-hidden relative h-32 bg-app-black"
        >
          <div class="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <PhPlus class="w-4 h-4 text-white" />
          </div>
          <div class="absolute inset-x-0 bottom-0 p-4 pb-4 bg-gradient-to-t from-black/80 to-transparent">
            <h3 class="text-[16px] font-semibold text-white">{{ list.title }}</h3>
            <p class="text-[12px] text-white/70 mt-0.5">{{ list.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="h-20" />
  </div>
</template>

<script setup lang="ts">
import { PhCaretLeft, PhGear, PhCaretRight, PhPlus } from '@phosphor-icons/vue'

definePageMeta({ layout: 'app' })

const router = useRouter()
const { user } = useAuth()

const activeTab = ref('My Lists')
const tabs = ['My Lists', 'My Recipes']

const displayName = computed(() => {
  if (!user.value) return ''
  const full = `${user.value.first_name || ''} ${user.value.last_name || ''}`.trim()
  return full || user.value.email
})

const avatarUrl = computed(() =>
  `https://i.pravatar.cc/200?u=${user.value?.email}`
)

const fakeLists = [
  { title: 'Weekly Meals', subtitle: '05 recipes' },
  { title: 'Favorites', subtitle: '12 recipes' },
]
</script>