// import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', 'animate.css'],
  app: {
    head: {
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js',
        },
        {
          src: 'lib/stats.js',
        },
      ],
    },
  },

  vite: {
    // plugins: [tailwindcss()],
    css: {
      preprocessorMaxWorkers: true, // Enable CSS preprocessing in Vite
      preprocessorOptions: {
        scss: {
          // additionalData: '@use "~/assets/_colors.scss" as *;',
        },
      },
    },
  },

  modules: [
    // [
    //   "@pinia/nuxt",
    //   {
    //     autoImports: ["defineStore", "acceptHMRUpdate"],
    //   },
    // ],
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
  ],
});
