import { createApp } from 'vue';
import App from './App.vue';
import { inject } from '@vercel/analytics';

inject();
import './style.css';
import 'tailwindcss/tailwind.css';
import './assets/cuIcon.css';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import router from './router';
const app = createApp(App);

import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

app.use(router).use(ElementPlus).mount('#app');
