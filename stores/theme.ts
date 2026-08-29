export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'web-tool-theme';

export function applyTheme(theme: ThemeMode) {
  if (!import.meta.client) return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export const useThemeStore = defineStore(
  'theme',
  () => {
    const theme = ref<ThemeMode>('dark');

    const isDark = computed(() => theme.value === 'dark');

    const setTheme = (mode: ThemeMode) => {
      theme.value = mode;
      applyTheme(mode);
    };

    const toggleTheme = () => {
      setTheme(theme.value === 'dark' ? 'light' : 'dark');
    };

    return {
      theme,
      isDark,
      setTheme,
      toggleTheme,
    };
  },
  {
    persist: {
      key: THEME_STORAGE_KEY,
      pick: ['theme'],
      storage: piniaPluginPersistedstate.localStorage(),
    },
  },
);
