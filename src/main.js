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
const pinia = createPinia();
app.use(pinia);

app.use(router).use(ElementPlus).mount('#app');
