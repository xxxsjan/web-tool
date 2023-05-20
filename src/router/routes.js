import HomePage from '../pages/home-page.vue';

export default [
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout.vue'),
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
        path: '/esm-to-commonjs',
        name: 'esm-to-commonjs',
        component: () => import('@/pages/esm-to-commonjs.vue'),
        meta: {
          title: 'esm➡️commonjs'
        }
      },
      {
        path: '/less-to-css',
        name: 'less-to-css',
        component: () => import('@/pages/less-to-css.vue'),
        meta: {
          title: 'less➡️css'
        }
      },
      // {
      //   path: "/scss-to-css",
      //   name: "scss-to-css",
      //   component: () => import("@/pages/scss-to-css.vue"),
      //   meta: {
      //     title: "scss➡️css",
      //   },
      // },
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
        component: () => import('@/pages/image-to-icon.vue'),
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
        path: 'path-transform',
        name: 'path-transform',
        component: () => import('@/pages/path-transform.vue'),
        meta: {
          title: 'windows路径转换'
        }
      },
      {
        path: 'vue-to-jsx',
        name: 'vue-to-jsx',
        component: () => import('@/pages/vue-to-jsx.vue'),
        meta: {
          title: 'vue-to-jsx'
        }
      }
    ]
  }
];
