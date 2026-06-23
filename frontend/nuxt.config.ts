import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    manifest: {
      name: 'ItoCook',
      short_name: 'ItoCook',
      description: 'Office kitchen management',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    strategies: 'injectManifest',
    srcDir: 'public',
    filename: 'sw.js',
  },

  css: [
    '@/assets/css/main.css'
  ],

  runtimeConfig: {
    directusUrl: 'http://directus:8055',
    directusAdminEmail: '',
    directusAdminPassword: '',
    public: {
      directusUrl: 'http://localhost:8055',
      vapidPublicKey: '',
    },
  },

  experimental: {
    viteEnvironmentApi: true,
  },

  devtools: { enabled: false },

  compatibilityDate: '2025-01-01',

  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 500,
      },
    },
    optimizeDeps: {
      include: ['@phosphor-icons/vue', '@vue/devtools-core', '@vue/devtools-kit'],
    },
  },

  app: {
    head: {
      title: 'ItoCook',
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👨‍🍳</text></svg>'
        }
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }
      ]
    }
  }
})
