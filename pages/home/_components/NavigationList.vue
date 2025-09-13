<template>
  <div class="index_page px-[6vw]">
    <div class="nya-container">
      <h3
        class="text-lg font-semibold text-gray-500 mb-4 ml-2 border-l-4 border-blue-500 pl-3"
      >
        工具
      </h3>
      <div
        class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="(item, index) in list"
          :key="index"
          class="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-200 group cursor-pointer"
          @click="go(item.path)"
        >
          <div class="card-body p-6">
            <h2 class="card-title text-lg text-gray-700">
              <i
                class="eva eva-arrow-forward-outline text-blue-500 group-hover:text-blue-600 mr-2 transition-colors"
              ></i>
              {{ item?.meta?.title || item.meta?.name || item.name }}
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
    icon?: string; // 新增图标类型
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

<style lang="scss" scoped>
.index_page {
  position: relative;
  box-sizing: border-box;
  margin: 88px auto;

  --theme: #249ffd;
  --color-text: #2f3e4c;
}

.nya-container {
  position: relative;
}

.nya-container .nya-title {
  background-color: var(--theme);
  border-radius: 0.5rem;
  box-shadow: 0 0.3125rem 0.5rem rgba(36, 159, 253, 0.302);
  color: #fff;
  font-size: 0;
  font-weight: 700;
  left: 1.875rem;
  padding: 0.5rem 0.9375rem;
  position: absolute;
  top: -3rem;
}

.nya-container .nya-title i {
  font-size: 1.25rem;
  margin-right: 0.3125rem;
  vertical-align: middle;
}

.nya-container .nya-title span {
  font-size: 1.0625rem;
  line-height: 1.25rem;
  vertical-align: middle;
}
</style>
