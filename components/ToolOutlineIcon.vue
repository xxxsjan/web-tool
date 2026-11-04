<script setup lang="ts">
/**
 * 描边工具图标，风格对齐 sj-app 的 tool-list.vue：
 * stroke="currentColor" + 彩色圆角底，键名与 utils/toolIconSvgs.ts 保持一致
 */
const props = withDefaults(
  defineProps<{
    name?: string;
    /** 图标盒尺寸（Tailwind 类），默认与 tool-list.vue 相同 */
    box?: string;
    /** svg 尺寸（Tailwind 类） */
    size?: string;
  }>(),
  {
    name: 'toolbox',
    box: 'w-9 h-9',
    size: 'h-5 w-5',
  },
);

/** icon 键名 → SVG path d（heroicons outline 同系） */
const pathMap: Record<string, string> = {
  /* 默认 */
  toolbox:
    'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',

  /* 抖音系 */
  tiktok:
    'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',

  /* 图片转换 */
  'arrow-sync':
    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',

  /* 图片去黑边（裁切） */
  'content-view': 'M6 2v14a2 2 0 002 2h14M2 6h14a2 2 0 012 2v14',

  /* 在线抠图（剪刀） */
  'design-ideas':
    'M7.1 16L19 4.5M14.4 16L2.5 4.5M9 18.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM17.5 18.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',

  /* 文本转语音 */
  'megaphone-loud':
    'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',

  /* GPT-SoVITS（芯片） */
  'bot-sparkle':
    'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',

  /* 白板（画笔） */
  'paint-brush':
    'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',

  /* svg 预览 */
  image:
    'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',

  /* 文本编辑 */
  notebook:
    'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',

  /* HTML 预览（终端） */
  'code-block':
    'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',

  /* Git 图床 */
  cloud:
    'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',

  /* IKUN 键盘 */
  'animal-paw-print':
    'M5 7h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zM7.5 11h.01M11 11h.01M14.5 11h.01M18 11h.01M8 14h.01M12 14h.01M16 14h.01M9.5 16.5h5',

  /* 视频转音频 */
  headphones:
    'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',

  /* 录音 */
  mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',

  /* VSCode 代码片段 */
  code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',

  /* 以下为备用键 */
  video:
    'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  gift: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  board: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  audio:
    'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
};

/** icon 键名 → 彩色底 + 描边色（与 tool-list.vue 的 iconClass 同系） */
const classMap: Record<string, string> = {
  toolbox: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  tiktok: 'bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
  'arrow-sync':
    'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  'content-view':
    'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'design-ideas':
    'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  'megaphone-loud':
    'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
  'bot-sparkle':
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  'paint-brush':
    'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  image: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  notebook:
    'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  'code-block':
    'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  cloud: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
  'animal-paw-print':
    'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  headphones:
    'bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300',
  mic: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  code: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  video: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  gift: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
  download: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  board: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  star: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  link: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
  audio: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
};

const d = computed(() => pathMap[props.name] ?? pathMap.toolbox);
const tintClass = computed(() => classMap[props.name] ?? classMap.toolbox);
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-lg"
    :class="[box, tintClass]"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :class="size"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.75"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" :d="d" />
    </svg>
  </span>
</template>
