import { applyTheme, useThemeStore, type ThemeMode } from '~/stores/theme';

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();
  applyTheme(themeStore.theme as ThemeMode);

  watch(
    () => themeStore.theme,
    (mode) => {
      applyTheme(mode as ThemeMode);
    },
  );
});
