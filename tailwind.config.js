/** @type {import('tailwindcss').Config} */

/** 语义色支持 bg-primary/50 这类透明度修饰 */
function withOpacity(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `var(${variable})`;
    }
    // slash 透明度是数字；ring 等会传入 var(--tw-*-opacity)
    return `color-mix(in oklab, var(${variable}) calc(${opacityValue} * 100%), transparent)`;
  };
}

const semanticColors = {
  'base-100': withOpacity('--color-base-100'),
  'base-200': withOpacity('--color-base-200'),
  'base-300': withOpacity('--color-base-300'),
  'base-content': withOpacity('--color-base-content'),
  primary: withOpacity('--color-primary'),
  'primary-content': withOpacity('--color-primary-content'),
  secondary: withOpacity('--color-secondary'),
  'secondary-content': withOpacity('--color-secondary-content'),
  accent: withOpacity('--color-accent'),
  'accent-content': withOpacity('--color-accent-content'),
  neutral: withOpacity('--color-neutral'),
  'neutral-content': withOpacity('--color-neutral-content'),
  info: withOpacity('--color-info'),
  'info-content': withOpacity('--color-info-content'),
  success: withOpacity('--color-success'),
  'success-content': withOpacity('--color-success-content'),
  warning: withOpacity('--color-warning'),
  'warning-content': withOpacity('--color-warning-content'),
  error: withOpacity('--color-error'),
  'error-content': withOpacity('--color-error-content'),
};

module.exports = {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: semanticColors,
      width: {
        '1/7': '14.2857143%',
        '2/7': '28.5714286%',
        '3/7': '42.8571429%',
        '4/7': '57.1428571%',
        '5/7': '71.4285714%',
        '6/7': '85.7142857%',
      },
    },
  },
  plugins: [],
};
