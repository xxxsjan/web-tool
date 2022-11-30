import { createApp } from 'vue';
import App from './App.vue';

import './style.css';
import 'tailwindcss/tailwind.css';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import { createRouter, createWebHistory } from 'vue-router';
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'layout',
      component: () => import('@/layout.vue'),
      redirect: '/vscode-snippet-generator',
      children: [
        {
          path: '/vscode-snippet-generator',
          name: 'vscode-snippet-generator',
          component: () => import('@/pages/vscode-snippet-generator.vue'),
        },
        {
          path: '/format-css-style',
          name: 'format-css-style',
          component: () => import('@/pages/format-css-style.vue'),
        },
      ],
    },
  ],
});
createApp(App).use(router).use(ElementPlus).mount('#app');
