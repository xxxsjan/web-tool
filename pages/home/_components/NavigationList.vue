<template>
  <div class="relative px-[6vw] py-20 mx-auto box-sizing-border">
    <div class="relative" v-for="(p, idx) in renderList" :key="idx">
      <h3
        class="text-xl font-bold text-gray-800 dark:text-white mb-6 ml-2 border-l-4 border-blue-500 pl-3 transition-all duration-300 hover:border-blue-600">
        {{ p.group }}
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-4">
        <div v-for="(item, index) in p.list" :key="item.path"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1 border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
          @click="go(item.path)">
          <div class="p-6 flex items-center">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
              {{ item.icon }}
            </div>
            <h2
              class="text-lg text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate">
              {{ item.label }}
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'nuxt/app';

const router = useRouter();

/** 标题形如 🎨图片去黑边：前缀 emoji + 文案 */
function splitTitle(title: string) {
  const text = title || '';
  const match = text.match(
    /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/u,
  );
  if (match?.[1]) {
    return {
      icon: match[1],
      label: text.slice(match[1].length).trim() || text,
    };
  }
  const chars = Array.from(text);
  if (!chars.length) return { icon: '🛠️', label: '未命名工具' };
  return {
    icon: chars[0],
    label: chars.slice(1).join('').trim() || text,
  };
}

type NavItem = {
  path: string;
  title: string;
  group: string;
  icon: string;
  label: string;
};

const extraItems: NavItem[] = [
];

const toolList = computed<NavItem[]>(() => {
  const fromRoutes = router
    .getRoutes()
    .filter(route => route.meta?.tool && route.path && route.path !== '/')
    .map(route => {
      const title = String(route.meta.title || route.name || route.path);
      const { icon, label } = splitTitle(title);
      return {
        path: route.path,
        title,
        group: String(route.meta.group || '工具'),
        icon,
        label,
      };
    });

  return [...fromRoutes, ...extraItems].sort((a, b) =>
    a.title.localeCompare(b.title, 'zh'),
  );
});

const renderList = computed(() => {
  const groups: { group: string; list: NavItem[] }[] = [];
  for (const item of toolList.value) {
    const found = groups.find(g => g.group === item.group);
    if (found) found.list.push(item);
    else groups.push({ group: item.group, list: [item] });
  }
  return groups;
});

async function go(path: string) {
  try {
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
