/**
 * 把 route.meta.title 同步到浏览器标签页标题。
 * 各页 definePageMeta({ title }) 原本只用于工具导航，不会自动进 <title>。
 */
export default defineNuxtPlugin(() => {
  const route = useRoute();

  useHead(() => {
    const raw = route.meta?.title;
    const pageTitle =
      typeof raw === 'string' && raw.trim() ? raw.trim() : '';

    if (!pageTitle || route.path === '/') {
      return { title: 'Tool' };
    }

    if (route.path === '/home') {
      return { title: '工具箱' };
    }

    return { title: `${pageTitle}` };
  });
});
