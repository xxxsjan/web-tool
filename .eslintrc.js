module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    'prettier',
    '.eslintrc-auto-import.json'
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser'
  },
  plugins: ['vue', '@typescript-eslint', 'simple-import-sort'],
  rules: {
    'no-unused-vars': 0,
    'no-useless-escape': 0,
    'vue/multi-word-component-names': 0,
    'no-inner-declarations': 0,

    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error'
    // 'simple-import-sort/imports': [
    //   'error',
    //   {
    //     groups: [
    //       [`^vue$`, `^vue-router$`, `^ant-design-vue$`, `^echarts$`], // 三方库
    //       [`.*\\.vue$`], // 组件
    //       // 本地文件的导入顺序
    //       [`.*/assets/.*`, `^@/assets$`],
    //       [`.*/hooks/.*`, `^@/hooks$`],
    //       [`.*/plugins/.*`, `^@/plugins$`],
    //       [`.*/router/.*`, `^@/router$`],
    //       [`.*/store/.*`, `^@/store$`],
    //       [`.*/utils/.*`, `^@/utils$`],
    //       [`^`], // 未匹配的
    //       [`^type `]
    //     ]
    //   }
    // ]
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/*.js', '*.test.js']
};
