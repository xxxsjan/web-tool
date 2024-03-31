import 'nprogress/nprogress.css';

import NProgress from 'nprogress';
import { createRouter, createWebHistory } from 'vue-router';

import routes from './routes';

NProgress.configure({
  showSpinner: true //  是否显示加载中的小圆圈
});
const router = createRouter({
  history: createWebHistory(),
  routes
});
router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});

router.afterEach(() => {
  NProgress.done();
});
export default router;
