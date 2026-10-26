<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '✏️无限画板',
  group: '工具',
  // 独立页面，不套用默认布局
  layout: false,
});

import { ElMessage } from 'element-plus';
import type { BoardApi, BoardHandle } from './tldraw-board';

const host = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const boardApi = shallowRef<BoardApi | null>(null);
const showHelp = ref(false);
const boardReady = ref(false);
let handle: BoardHandle | null = null;

onMounted(async () => {
  // 本页固定亮色主题，不跟随站点主题
  useHead({ htmlAttrs: { 'data-theme': 'light', class: '' } });
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';

  if (!host.value) return;
  // tldraw 是 React 组件，仅在客户端动态加载
  const { mountBoard } = await import('./tldraw-board');
  handle = mountBoard(host.value);
  boardApi.value = handle.api;
  boardReady.value = true;
});

onBeforeUnmount(() => {
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
    saveBlob(blob, `whiteboard-${new Date().toISOString().slice(0, 10)}.tldr`);
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
        <input ref="fileInput" type="file" accept=".tldr,application/vnd.tldraw+json" class="hidden"
          @change="onDraftPicked" />
        <button type="button" class="btn btn-ghost btn-sm" @click="boardApi?.resetZoom()">
          适应画布
        </button>
        <button type="button" class="btn btn-ghost btn-sm" @click="showHelp = !showHelp">
          快捷键
        </button>
      </div>
    </header>

    <main class="relative min-h-0 flex-1">
      <!-- React 画板挂载点，需明确高度 -->
      <div ref="host" class="h-full w-full" />
      <div v-if="!boardReady"
        class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
        画板加载中…
      </div>

      <!-- 上移避开 tldraw 底部工具条，z-index 超过 tldraw UI 图层 -->
      <div v-if="showHelp" class="pointer-events-none absolute inset-x-0 bottom-20 z-[1200] flex justify-center p-3">
        <div class="pointer-events-auto rounded-xl border border-zinc-200 bg-white/95 px-4 py-2 text-xs text-zinc-600 shadow-lg backdrop-blur">
          快捷键：V 选择 · D 画笔 · E 橡皮 · A 箭头 · R 矩形 · O 椭圆 · T 文本 · N 便签 · 空格拖动 · 滚轮缩放
        </div>
      </div>
    </main>
  </div>
</template>
