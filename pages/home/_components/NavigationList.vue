<template>
  <div class="relative px-[6vw] py-20 mx-auto box-sizing-border">
    <div class="relative" v-for="(p, idx) in renderList" :key="idx">
      <h3
        class="text-xl font-bold text-gray-800 dark:text-white mb-6 ml-2 border-l-4 border-blue-500 pl-3 transition-all duration-300 hover:border-blue-600"
      >
        {{ p.group }}
      </h3>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-4"
      >
        <div
          v-for="(item, index) in p.list"
          :key="index"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1 border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
          @click="go(item.path)"
        >
          <div class="p-6 flex items-center">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300"
            >
              {{
                (item?.meta?.title || item.meta?.name || item.name).slice(0, 2)
              }}
            </div>
            <h2
              class="text-lg text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate"
            >
              {{ (item?.meta?.title || item.meta?.name || item.name).slice(2) }}
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'nuxt/app';
const router = useRouter();
const pageModule = import.meta.glob('/pages/**/page.js', {
  eager: true,
  import: 'default',
});
interface RouteItem {
  path: string;
  name: string;
  meta?: {
    title?: string;
    name?: string;
    icon?: string;
  };
}

const autoRoutes = Object.entries(pageModule).map(
  ([pageJsPath, meta]): RouteItem => {
    console.log('pageJsPath: ', pageJsPath);
    const pageName = pageJsPath.replace(/^\/pages\/(.+)\/page\.js$/, '$1');

    const routePathArr = pageName.split('/');
    const name = routePathArr[routePathArr.length - 1];

    return {
      path: '/' + pageName,
      name,
      meta,
    };
  },
);

const list: RouteItem[] = [
  ...autoRoutes,
  {
    path: '/html/text-reading.html',
    name: '🔊文字朗读',
  },
  {
    path: '/openurl/index.html',
    name: '🚀批量打开网页',
  },
].sort((a, b) => a.name.localeCompare(b.name, 'zh')); // 添加中文排序

const renderList = [];
list.map(item => {
  const group = item.meta?.group || '工具';
  const found = renderList.find(item => item.group === group);
  if (found) {
    found.list.push(item);
  } else {
    renderList.push({
      group,
      list: [item],
    });
  }
});

async function go(path: string) {
  try {
    // 确保路径以斜杠开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (normalizedPath.includes('.html')) {
      window.open(normalizedPath);
    } else {
      await router.push(normalizedPath);
    }
  } catch (error) {
    console.error('Navigation failed:', error);
  }
}
</script>

<style scoped>
/* 仅保留绝对必要的样式，完全基于Tailwind类实现 */
</style>
