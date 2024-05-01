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
      {
        path: 'preview-html',
        name: 'preview-html',
        component: () => import('@/pages/preview-html.vue'),
        meta: {
          title: '三件套预览html'
        }
      },
      {
        path: '/vscode-snippet-generator',
        name: 'vscode-snippet-generator',
        component: () => import('@/pages/vscode-snippet-generator.vue'),
        meta: {
          title: 'vscode用户代码片段'
        }
      },
      {
        path: '/format-css-style',
        name: 'format-css-style',
        component: () => import('@/pages/format-css-style.vue'),
        meta: {
          title: 'css style➡️对象'
        }
      },
      {
        path: '/template-to-string',
        name: 'template-to-string',
        component: () => import('@/pages/template-to-string.vue'),
        meta: {
          title: '模板字符串➡️普通字符串'
        }
      },

      {
        path: '/cut-image',
        name: 'cut-image',
        component: () => import('@/pages/cut-image.vue'),
        meta: {
          title: '图片去黑边'
        }
      },
      {
        path: '/image-to-icon',
        name: 'image-to-icon',
        component: () => import('@/pages/image-to-icon/index.vue'),
        meta: {
          title: '图片转icon'
        }
      },
      {
        path: '/package-to-cli',
        name: 'package-to-cli',
        component: () => import('@/pages/package-to-cli.vue'),
        meta: {
          title: '依赖包转命令'
        }
      },
      {
        path: 'string-transform',
        name: 'string-transform',
        component: () =>
          import('@/pages/string-transform/string-transform.vue'),
        meta: {
          title: '字符转换'
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
  console.log('pageComps: ', pageComps);

  const autoRoutes = Object.entries(pageModule)
    .map(([pageJsPath, meta]) => {
      const pageName = pageJsPath.replace(
        /(\/src\/pages\/)(.+)(\/page\.js)/,
        '$2'
      );
      console.log(pageName);
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
