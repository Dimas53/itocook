<template>
  <div class="relative w-full h-full overflow-hidden flex flex-col">
    <div class="absolute top-0 left-0 w-full h-[300px] shrink-0 overflow-hidden">
      <img src="/images/login_bg.jpg" alt="" class="w-full h-full object-cover" />
      <div class="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t to-transparent" />
    </div>

    <div class="relative z-10 mt-[200px] flex-1 flex flex-col">
      <div class="rounded-t-[32px] bg-auth-bg w-full flex-1 flex flex-col px-6 py-8">
        <div class="bg-white rounded-full p-1 flex mb-6">
          <button
            @click="isSignUp = false; errorMsg = ''"
            class="flex-1 h-10 rounded-full text-[14px] font-semibold transition-all duration-200"
            :class="!isSignUp ? 'bg-app-black text-white' : 'text-gray-500 bg-transparent'"
          >
            Log In
          </button>
          <button
            @click="isSignUp = true; errorMsg = ''"
            class="flex-1 h-10 rounded-full text-[14px] font-semibold transition-all duration-200"
            :class="isSignUp ? 'bg-app-black text-white' : 'text-gray-500 bg-transparent'"
          >
            Sign Up
          </button>
        </div>

        <div class="mb-6 text-center">
          <h2 class="text-2xl font-bold text-app-black">
            {{ isSignUp ? 'Sign Up with ItoCook' : 'Log In with ItoCook' }}
          </h2>
          <p class="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
            {{ isSignUp
              ? 'Sign up with ItoCook to enjoy recipes healthy tips and smart wellness guidance easily.'
              : 'ItoCook helps quickly access personalized recipes tips and wellness guidance.'
            }}
          </p>
        </div>

        <div class="flex-1">
          <!-- Sign Up form -->
          <form v-if="isSignUp" @submit.prevent="handleSubmit" class="flex flex-col">
            <div class="space-y-3">
              <div class="flex gap-3">
                <input
                  v-model="firstName"
                  type="text"
                  name="firstName"
                  autocomplete="given-name"
                  placeholder="First Name"
                  class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
                />
                <input
                  v-model="lastName"
                  type="text"
                  name="lastName"
                  autocomplete="family-name"
                  placeholder="Last Name"
                  class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
                />
              </div>
              <input
                v-model="email"
                type="text"
                name="email"
                autocomplete="email"
                placeholder="Email or Phone Number"
                class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
              />
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  name="password"
                  autocomplete="new-password"
                  placeholder="Password"
                  class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 pr-11 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400"
                  @click="showPassword = !showPassword"
                  tabindex="-1"
                >
                  <component :is="showPassword ? PhEye : PhEyeClosed" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <p v-if="errorMsg" class="text-red-500 text-[13px] mt-3 text-center">{{ errorMsg }}</p>

            <button
              type="submit"
              :disabled="validating"
              class="w-full h-14 rounded-full mt-5 font-semibold text-[16px] text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              :class="validating ? 'bg-primary/60' : 'bg-primary'"
            >
              <svg v-if="validating" class="animate-spin size-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Sign Up
            </button>
          </form>

          <!-- Log In form -->
          <form v-else @submit.prevent="handleSubmit" class="flex flex-col">
            <div class="space-y-3">
              <input
                v-model="email"
                type="text"
                name="email"
                autocomplete="email"
                placeholder="Email or Phone Number"
                class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
              />
              <div>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="password"
                    autocomplete="current-password"
                    placeholder="Password"
                    class="w-full h-12 bg-white/40 border border-primary/20 rounded-xl px-4 pr-11 text-base placeholder-gray-500 outline-none focus:bg-white focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400"
                    @click="showPassword = !showPassword"
                    tabindex="-1"
                  >
                    <component :is="showPassword ? PhEye : PhEyeClosed" class="w-5 h-5" />
                  </button>
                </div>
                <div class="flex justify-end mt-2">
                  <a href="#" class="text-xs text-gray-500 font-medium">Forgot Password?</a>
                </div>
              </div>
            </div>

            <p v-if="errorMsg" class="text-red-500 text-[13px] mt-3 text-center">{{ errorMsg }}</p>

            <button
              type="submit"
              :disabled="validating"
              class="w-full h-14 rounded-full mt-5 font-semibold text-[16px] text-white active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              :class="validating ? 'bg-primary/60' : 'bg-primary'"
            >
              <svg v-if="validating" class="animate-spin size-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Log In
            </button>
          </form>
        </div>

        <div class="flex items-center my-6">
          <div class="flex-1 h-px bg-gray-200" />
          <span class="px-4 text-xs text-gray-400 font-medium">Or</span>
          <div class="flex-1 h-px bg-gray-200" />
        </div>

        <div class="flex flex-row gap-3 w-full">
          <button class="flex-1 h-12 border border-gray-200 rounded-full flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span class="text-sm font-medium text-app-black">Apple</span>
          </button>
          <button class="flex-1 h-12 border border-gray-200 rounded-full flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-transform">
            <svg viewBox="0 0 24 24" class="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span class="text-sm font-medium text-app-black">Google</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhEye, PhEyeClosed } from '@phosphor-icons/vue'

definePageMeta({
  darkStatus: true
})

const { signUp, login, isTodayCook } = useAuth()
const router = useRouter()

// ── redirectAfterLogin ──────────────────────────────────────────────────
// Always redirect to home — cook panel is only accessible via user click.
async function redirectAfterLogin() {
  router.push('/')
}

const isSignUp = ref(true)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const validating = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(): boolean {
  errorMsg.value = ''

  if (isSignUp.value) {
    if (!firstName.value || !lastName.value || !email.value || !password.value) {
      errorMsg.value = 'Please fill in all fields.'
      return false
    }
    if (!emailRegex.test(email.value)) {
      errorMsg.value = 'Please enter a valid email address.'
      return false
    }
    if (password.value.length < 6) {
      errorMsg.value = 'Password must be at least 6 characters.'
      return false
    }
  } else {
    if (!email.value || !password.value) {
      errorMsg.value = 'Please enter email and password.'
      return false
    }
    if (!emailRegex.test(email.value)) {
      errorMsg.value = 'Please enter a valid email address.'
      return false
    }
  }
  return true
}

  // ── handleSubmit ─────────────────────────────────────────────────────
  // Runs on login or registration form submit.
  // Login → useAuth().login() → useDirectus().request('post', '/auth/login')
  // Registration → useAuth().signUp() → fetch('/api/auth/signup') → Nuxt server route
  async function handleSubmit() {
    if (!validate()) return

    validating.value = true
    errorMsg.value = ''

    try {
      if (isSignUp.value) {
        await signUp(firstName.value, lastName.value, email.value, password.value)
      } else {
        // directus api — login() → POST /auth/login → Directus
        await login(email.value, password.value)
      }
      await redirectAfterLogin()
    } catch (e) {
      errorMsg.value = (e as Error).message
    } finally {
      validating.value = false
    }
  }
</script>

<style scoped>
</style>
