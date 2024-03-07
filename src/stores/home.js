import { defineStore } from 'pinia';

export const useHomeStore = defineStore('home', {
  state: () => ({ showWelcome: true }),
  getters: {
    // double: state => state.count * 2
  },
  actions: {},
  persist: {
    storage: window.sessionStorage
  }
});
