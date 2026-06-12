<template>
  <div>
    <label class="text-[12px] font-semibold text-app-black/60 uppercase tracking-wide mb-2 block">
      Photo
    </label>

    <!-- Preview -->
    <div v-if="previewUrl" class="relative mb-2">
      <img
        :src="previewUrl"
        alt="Recipe photo preview"
        class="w-full h-40 rounded-xl object-cover bg-gray-100"
      />
      <button
        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-[0.98]"
        @click="removeImage"
        type="button"
      >
        <PhTrash class="w-4 h-4 text-red-500" />
      </button>
    </div>

    <!-- Drop zone -->
    <div
      ref="dropZone"
      class="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
      :class="{
        'border-primary bg-primary-light/30': isDragOver,
        'bg-white': !isDragOver && !previewUrl,
        'bg-gray-50 opacity-50 pointer-events-none': previewUrl,
      }"
      @click="openFilePicker"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <PhUploadSimple class="w-6 h-6 text-gray-400" />
      <p class="text-[13px] text-gray-400 text-center">
        <span class="font-medium text-primary">Tap to browse</span> or drag &amp; drop
      </p>
      <p class="text-[11px] text-gray-300">Max 5MB · JPEG / PNG / WebP</p>
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileSelected"
      />
    </div>

    <p v-if="error" class="text-[12px] text-red-500 mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { PhTrash, PhUploadSimple } from '@phosphor-icons/vue'

const config = useRuntimeConfig()
const MAX_SIZE = 5 * 1024 * 1024
const MAX_WIDTH = 1200
const JPEG_QUALITY = 0.85
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const props = defineProps<{
  photo?: string | null
}>()

const emit = defineEmits<{
  selected: [file: File]
  cleared: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const dropZone = ref<HTMLElement | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref('')
const isDragOver = ref(false)

function resolvePreview(photo: string | null | undefined): string | null {
  if (!photo) return null
  if (UUID_RE.test(photo)) return `${config.public.directusUrl}/assets/${photo}`
  return photo
}

onMounted(() => {
  previewUrl.value = resolvePreview(props.photo)
  document.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', onPaste)
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

function openFilePicker() {
  if (previewUrl.value) return
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  if (previewUrl.value) return
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function onPaste(e: ClipboardEvent) {
  if (previewUrl.value) return
  const items = e.clipboardData?.items
  if (!items) return
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item?.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        processFile(file)
        e.preventDefault()
        break
      }
    }
  }
}

async function processFile(file: File) {
  error.value = ''

  if (!file.type.startsWith('image/')) {
    error.value = 'Only image files are accepted'
    return
  }

  if (file.size > MAX_SIZE) {
    error.value = `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 5MB`
    return
  }

  try {
    const resized = await resizeImage(file, MAX_WIDTH, JPEG_QUALITY)
    const resizedFile = new File([resized], file.name.replace(/\.[^.]+$/, '.jpg'), {
      type: 'image/jpeg',
    })

    previewUrl.value = URL.createObjectURL(resizedFile)
    emit('selected', resizedFile)
  } catch {
    error.value = 'Failed to process image'
    previewUrl.value = null
  }
}

function removeImage() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
  emit('cleared')
}

function resizeImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height / width) * maxWidth)
        width = maxWidth
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob failed'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
</script>
