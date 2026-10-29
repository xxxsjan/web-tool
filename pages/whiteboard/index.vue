<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '✏️无限画板',
  group: '工具',
  // 独立页面，不套用默认布局
  layout: false,
});

import { ElMessage } from 'element-plus';
import type { BoardApi, BoardHandle } from './excalidraw-board';

const host = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const boardApi = shallowRef<BoardApi | null>(null);
const showHelp = ref(false);
const boardReady = ref(false);
let handle: BoardHandle | null = null;
/** await 动态 import 期间若已离开页面，禁止再挂载 */
let mountCancelled = false;

// 本页固定亮色主题，不跟随站点主题；顶层声明让 SSR/CSR 同源输出，避免 hydration mismatch
useHead({ htmlAttrs: { 'data-theme': 'light', class: '' } });

onMounted(async () => {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';

  if (!host.value) return;

  // Excalidraw 是 React 组件，仅在客户端动态加载
  const { mountBoard } = await import('./excalidraw-board');
  if (mountCancelled || !host.value) return;

  handle = mountBoard(host.value, {
    onReady: () => {
      if (!mountCancelled) boardReady.value = true;
    },
  });
  boardApi.value = handle.api;
});

onBeforeUnmount(() => {
  mountCancelled = true;
  handle?.destroy();
  handle = null;
  boardApi.value = null;
});

async function exportSvg() {
  try {
    const svg = await boardApi.value?.getSvg();
    if (!svg) return;
    saveBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'whiteboard.svg');
  } catch (error) {
    ElMessage.warning((error as Error).message);
  }
}

async function exportPng() {
  try {
    const blob = await boardApi.value?.getPng();
    if (!blob) return;
    saveBlob(blob, 'whiteboard.png');
  } catch (error) {
    ElMessage.warning((error as Error).message);
  }
}

async function exportDraft() {
  try {
    const blob = await boardApi.value?.getDraftFile();
    if (!blob) return;
    saveBlob(blob, `whiteboard-${new Date().toISOString().slice(0, 10)}.excalidraw`);
  } catch (error) {
    ElMessage.warning((error as Error).message);
  }
}

function pickDraft() {
  fileInput.value?.click();
}

async function onDraftPicked(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    const ok = await boardApi.value?.loadDraftFile(file);
    if (ok) ElMessage.success(`已导入 ${file.name}`);
  } catch (error) {
    ElMessage.error((error as Error).message);
  }
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success(`已导出 ${filename}`);
}
</script>

<template>
  <div class="flex h-screen w-full flex-col overflow-hidden bg-white text-zinc-900">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5">
      <div class="flex min-w-0 items-baseline gap-3">
        <h1 class="text-base font-semibold">无限画板</h1>
        <p class="hidden truncate text-xs text-zinc-500 sm:block">
          支持绘图、便签、图片、箭头，内容自动保存在本地
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="btn btn-primary btn-sm" @click="exportPng">
          导出 PNG
        </button>
        <button type="button" class="btn btn-ghost btn-sm border border-zinc-300" @click="exportSvg">
          导出 SVG
        </button>
        <button type="button" class="btn btn-ghost btn-sm border border-zinc-300" @click="exportDraft">
          导出草稿
        </button>
        <button type="button" class="btn btn-ghost btn-sm border border-zinc-300" @click="pickDraft">
          导入草稿
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".excalidraw,application/vnd.excalidraw+json,application/json"
          class="hidden"
          @change="onDraftPicked"
        />
        <button type="button" class="btn btn-ghost btn-sm" @click="boardApi?.resetZoom()">
          适应画布
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="showHelp = !showHelp">
          快捷键
        </button>
      </div>
    </header>

    <main class="relative min-h-0 flex-1">
      <!--
        v-once：禁止 Vue 后续 patch 这个空节点。
        否则 boardReady / showHelp 等状态更新时，Vue 会把 React 挂进去的 DOM 清掉。
      -->
      <div ref="host" v-once class="h-full w-full" />
      <div
        v-if="!boardReady"
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400"
      >
        画板加载中…
      </div>

      <!-- 上移避开底部工具条 -->
      <div
        v-if="showHelp"
        class="pointer-events-none absolute inset-x-0 bottom-20 z-[1200] flex justify-center p-3"
      >
        <div
          class="pointer-events-auto rounded-xl border border-zinc-200 bg-white/95 px-4 py-2 text-xs text-zinc-600 shadow-lg backdrop-blur"
        >
          快捷键：1 选择 · 2 矩形 · 3 菱形 · 4 椭圆 · 5 箭头 · 6 线条 · 7 画笔 · 8 文本 · 9 图片 · 0 橡皮 ·
          Ctrl+Z 撤销 · 空格拖动 · 滚轮缩放
        </div>
      </div>
    </main>
  </div>
</template>
