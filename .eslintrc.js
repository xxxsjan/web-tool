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
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'no-unused-vars': 0,
    'no-useless-escape': 0,
    'vue/multi-word-component-names': 0
  },
  ignorePatterns: ['node_modules/', 'dist/', 'build/*.js', '*.test.js'],
  globals: {
    defineOptions: true
  }
};
