import { computed } from 'vue';
import { useRouter } from 'nuxt/app';

export type ToolNavItem = {
  path: string;
  title: string;
  group: string;
  icon: string;
  label: string;
};

/** 标题形如 🎨图片去黑边：前缀 emoji + 文案 */
export function splitToolTitle(title: string) {
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

const extraItems: ToolNavItem[] = [];

export function useToolNav() {
  const router = useRouter();

  const toolList = computed<ToolNavItem[]>(() => {
    const fromRoutes = router
      .getRoutes()
      .filter(route => route.meta?.tool && route.path && route.path !== '/')
      .map(route => {
        const title = String(route.meta.title || route.name || route.path);
        const { icon, label } = splitToolTitle(title);
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

  const groupedTools = computed(() => {
    const groups: { group: string; list: ToolNavItem[] }[] = [];
    for (const item of toolList.value) {
      const found = groups.find(g => g.group === item.group);
      if (found) found.list.push(item);
      else groups.push({ group: item.group, list: [item] });
    }
    return groups;
  });

  async function goTool(path: string) {
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

  return {
    toolList,
    groupedTools,
    goTool,
  };
}
