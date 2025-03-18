export const useHomeStore = defineStore(
  'home',
  () => {
    const showWelcome = ref(true);

    const setShowWelcome = (val: boolean) => {
      showWelcome.value = val;
    };

    return {
      showWelcome,
      setShowWelcome,
    };
  },
  //   https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt.html
  {
    persist: true,
  },
);
