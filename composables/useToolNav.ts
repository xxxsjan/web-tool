import { computed } from 'vue';
import { useRouter } from 'nuxt/app';

export type ToolNavItem = {
  path: string;
  title: string;
  group: string;
  /** 自绘彩色 SVG 键名，见 utils/toolIconSvgs.ts */
  icon: string;
  label: string;
};

/** 去掉历史遗留的标题前缀 emoji，便于过渡 */
function cleanToolTitle(title: string) {
  const text = (title || '').trim();
  if (!text) return '未命名工具';
  return (
    text
      .replace(
        /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+/u,
        '',
      )
      .trim() || text
  );
}

const extraItems: ToolNavItem[] = [];

/** 这些工具在独立窗口中打开，不进入站内布局 */
const standalonePaths = new Set<string>(['/whiteboard']);

export function useToolNav() {
  const router = useRouter();

  const toolList = computed<ToolNavItem[]>(() => {
    const fromRoutes = router
      .getRoutes()
      .filter(route => route.meta?.tool && route.path && route.path !== '/')
      .map(route => {
        const rawTitle = String(route.meta.title || route.name || route.path);
        const label = cleanToolTitle(rawTitle);
        const icon = String(route.meta.icon || 'toolbox');
        return {
          path: route.path,
          title: label,
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
      if (normalizedPath.includes('.html') || standalonePaths.has(normalizedPath)) {
        window.open(normalizedPath, '_blank', 'noopener');
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
