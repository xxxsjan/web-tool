import Layout from '@/layout/index.vue';
import HomePage from '@/pages/home/home-page.vue';

export default [
  {
    path: '/',
    name: 'layout',
    component: Layout,
    redirect: '/vscode-snippet-generator',
    children: [
      {
        path: '/',
        name: 'home-page',
        component: HomePage,
        meta: {
          title: '首页'
        }
      },

      ...autoImport()
    ]
  },
  {
    path: '/ikun-keyboard',
    name: 'ikun-keyboard',
    component: () => import('@/pages/ikun-keyboard.vue')
  }
];

function autoImport() {
  // https://cn.vitejs.dev/guide/features.html#glob-import

  // globEager('xxx')等同于glob('xxx',{ eager: true })
  const pageModule = import.meta.glob('/src/pages/**/page.js', {
    eager: true, // 同步加载 直接获取对象
    import: 'default' // 直接获取default
  });

  const pageComps = import.meta.glob('/src/pages/**/index.vue');
  // const pageComps = import.meta.glob('/src/pages/**/index.vue', {
  //   eager: true,
  //   import: 'default'
  // });

  const autoRoutes = Object.entries(pageModule)
    .map(([pageJsPath, meta]) => {
      const pageName = pageJsPath.replace(
        /(\/src\/pages\/)(.+)(\/page\.js)/,
        '$2'
      );
    
      const routePathArr = pageName.split('/');
      const name = routePathArr[routePathArr.length - 1];

      const vueFilePath = `/src/pages/${pageName}/index.vue`;

      return {
        path: '/' + pageName,
        name,
        component: pageComps[vueFilePath],
        meta
      };
    })
    .filter(f => f.component);
  console.log('✅autoRoutes', autoRoutes);
  return autoRoutes;
}
