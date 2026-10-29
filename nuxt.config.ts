// import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    /** 阿里云百炼 API Key，仅服务端可读 */
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',
    /** 可选：业务空间 ID，设置后走专属域名 */
    dashscopeWorkspaceId: process.env.DASHSCOPE_WORKSPACE_ID || '',
    /** GPT-SoVITS api_v2 默认地址（仅本机） */
    gptsovitsBaseUrl: process.env.GPTSOVITS_BASE_URL || 'http://127.0.0.1:9880',
  },
  css: [
    '~/assets/css/main.css',
    'animate.css',
    'element-plus/theme-chalk/dark/css-vars.css',
  ],
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'dark',
        class: 'dark',
      },
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js',
        },
        {
          src: 'lib/stats.js',
        },
        {
          src: 'lib/gif.js',
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
    optimizeDeps: {
      // Prebundle so bare imports inside the package resolve in the browser.
      // Excluding it serves raw ESM with unresolved `onnxruntime-web` imports.
      include: [
        '@imgly/background-removal',
        'onnxruntime-web',
        'onnxruntime-web/webgpu',
        'tldraw',
        'react',
        'react-dom/client',
      ],
    },
    assetsInclude: ['**/*.onnx', '**/*.wasm'],
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
    '@element-plus/nuxt',
  ],

  routeRules: {
    '/image-to-icon': { redirect: '/image-convert' },
    '/image-to-icon/**': { redirect: '/image-convert' },
  },

  nitro: {
    // Edge TTS 的 Sec-MS-GEC v2 令牌依赖 BigInt 字面量与 64 位运算，
    // Nitro 默认的 es2019 目标会降级失败，显式提升到 Node 20。
    esbuild: {
      options: {
        target: 'node20',
      },
    },
    /** 令牌生成是纯计算，无需打包 Python 等外部资源 */
    externals: {
      inline: [],
    },
  },
});
