import svgLoader from 'vite-svg-loader'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false,

  app: {
    head: {
      title: 'Timatic',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Rubik:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },

  components: {
    dirs: [
      { path: '~/components', pathPrefix: false }
    ]
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n'
  ],

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  },

  i18n: {
    locales: [
      {
        name: 'English',
        code: 'en',
        file: 'en.js'
      }
    ],
    restructureDir: '',
    langDir: 'app/assets/lang/',
    lazy: true,
    defaultLocale: 'en'
  },

  vite: {
    plugins: [
      svgLoader({ defaultImport: 'component' })
    ],
    server: {
      allowedHosts: ['app.timatic.test']
    }
  },

  runtimeConfig: {
    public: {
      isLockedAfterDays: 10
    }
  },

  router: {
    options: {
      strict: false
    }
  }
})
