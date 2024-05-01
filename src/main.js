import { inject } from '@vercel/analytics';
import { createApp } from 'vue';

import App from './App.vue';

inject();
import 'virtual:svg-icons-register';
import './assets/cuIcon.css';
import './style.css';
import 'element-plus/dist/index.css';
import 'tailwindcss/tailwind.css';

import ElementPlus from 'element-plus';

import router from './router';
const app = createApp(App);

import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);

app.use(router).use(ElementPlus).mount('#app');
