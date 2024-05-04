import vue from '@vitejs/plugin-vue';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import DefineOptions from 'unplugin-vue-define-options/vite';
import { defineConfig } from 'vite';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [
      vue(),
      AutoImport({
        // 会在根目录生成auto-imports.d.ts，里面可以看到自动导入的api
        dts: true,
        // 匹配的文件，也就是哪些后缀的文件需要自动引入
        include: [/\.[tj]sx?$/, /\.vue$/],
        // 自动引入的api从这里找
        imports: [
          'vue',
          'vue-router',
          {
            'element-plus': [
              'ElMenuItem',
              'ElSubMenu',
              'ElMenu',
              'ElMessage',
              'ElMessageBox',
            ],
            'unplugin-vue-define-options/macros': ['defineOptions'],
          },
        ],
        // 解析器配置
        resolvers: [
          ElementPlusResolver(), // 自动导入Element-Plus的Api
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
        // 根据项目情况配置eslintrc，默认是不开启的
        eslintrc: {
          enabled: true, // @default false
          // 下面两个是其他配置，默认即可
          // 输出一份json文件，默认输出路径为./.eslintrc-auto-import.json
          // filepath: './.eslintrc-auto-import.json', // @default './.eslintrc-auto-import.json'
          // globalsPropValue: true, // @default true 可设置 boolean | 'readonly' | 'readable' | 'writable' | 'writeable'
        },
      }),
      Components({
        resolvers: [
          IconsResolver({
            enabledCollections: ['ep'], //@iconify-json/ep 是 Element Plus 的图标库，所以 IconsResolver 配置了 enabledCollections: ['ep']
          }),
          ElementPlusResolver(),
        ],
        dts: true,
      }),
      Icons({
        autoInstall: true,
      }),
      DefineOptions(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3333,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router'],
            'element-plus': ['element-plus'],
            dayjs: ['dayjs'],
          },
          chunkFileNames(chunkInfo) {
            const { facadeModuleId } = chunkInfo;
            let name = '[name]';
            if (facadeModuleId) {
              const pattern = /\/([^/]+)\/index.vue$/;
              const match = facadeModuleId.match(pattern);
              name = match ? match[1] : name;
            }
            return `static/js/${name}-[hash].js`;
          },
          entryFileNames: `static/js/app-[hash].js`,
          assetFileNames: `static/[ext]/[name]-[hash].[ext]`,
        },
      },
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
