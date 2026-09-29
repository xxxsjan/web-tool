<template>
  <div class="image-matting mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        在线抠图
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        AI 去背景 · 橡皮擦 / 背景擦 / 魔术擦 · 导出透明 PNG
      </p>
    </header>

    <!-- 空状态 -->
    <div v-if="!hasImage" class="mx-auto w-full max-w-lg">
      <div
        class="relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl tool-panel px-4 py-10 text-center transition-colors"
        :class="isDragging ? 'ring-2 ring-primary/50 bg-primary/10' : 'hover:bg-base-content/[0.03]'"
        @click="triggerFileInput"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
        </span>
        <div>
          <p class="text-base font-medium text-base-content">
            {{ isDragging ? '松开即可添加图片' : '点击、拖拽或 Ctrl+V 粘贴图片' }}
          </p>
          <p class="mt-1 text-xs text-base-content/50">PNG / JPG / WebP · 建议小于 8MB</p>
        </div>
      </div>
    </div>

    <!-- 编辑区 -->
    <div v-else class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <section class="min-w-0 flex-1 overflow-hidden rounded-2xl tool-panel">
        <div class="flex items-center justify-between gap-2 border-b border-base-content/10 px-4 py-2.5">
          <span class="text-sm font-medium text-base-content">画布</span>
          <span class="font-mono text-[11px] text-base-content/45">
            {{ canvasWidth }}×{{ canvasHeight }}
            <template v-if="outputFileSize"> · 输出 {{ formatBytes(outputFileSize) }}</template>
            <template v-else-if="sourceFileSize"> · {{ formatBytes(sourceFileSize) }}</template>
          </span>
        </div>
        <div
          class="checker relative flex max-h-[min(70vh,640px)] min-h-[280px] items-center justify-center overflow-auto p-4"
          v-loading="processing"
          :element-loading-text="loadingText"
        >
          <canvas
            ref="viewCanvas"
            class="view-canvas touch-none rounded-lg shadow-lg"
            :class="tool === 'magic-eraser' ? 'cursor-pointer' : 'cursor-crosshair'"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointerleave="onPointerUp"
            @pointercancel="onPointerUp"
          />
        </div>
      </section>

      <aside class="w-full shrink-0 space-y-3 lg:w-72 xl:w-80">
        <section class="overflow-hidden rounded-2xl tool-panel p-4">
          <p class="mb-3 text-sm font-semibold text-base-content">处理</p>
          <button
            type="button"
            class="btn btn-primary btn-sm w-full"
            :disabled="processing"
            @click="runAiMatting"
          >
            <span v-if="processing && stage === 'ai'" class="loading loading-spinner loading-xs"></span>
            {{ processing && stage === 'ai' ? 'AI 抠图中…' : 'AI 一键抠图' }}
          </button>
          <p class="mt-2 text-[11px] leading-relaxed text-base-content/45">
            首次使用会下载模型（约几十 MB），之后可离线使用。复杂边缘可用画笔精修。
          </p>
        </section>

        <section class="overflow-hidden rounded-2xl tool-panel p-4">
          <p class="mb-3 text-sm font-semibold text-base-content">精修工具</p>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="item in toolOptions"
              :key="item.id"
              type="button"
              class="btn btn-sm h-auto min-h-0 justify-start gap-2.5 px-2.5 py-2"
              :class="tool === item.id ? 'btn-primary' : 'btn-ghost bg-base-content/5'"
              :disabled="!hasImage || processing"
              @click="tool = item.id"
            >
              <span class="tool-icon" v-html="item.icon" />
              <span class="flex min-w-0 flex-1 flex-col items-start text-left">
                <span class="text-xs font-medium leading-tight">{{ item.label }}</span>
                <span
                  class="mt-0.5 text-[10px] font-normal leading-tight opacity-60"
                  :class="tool === item.id ? 'text-primary-content' : ''"
                >{{ item.hint }}</span>
              </span>
            </button>
          </div>

          <label
            v-if="tool !== 'magic-eraser'"
            class="mt-3 flex items-center justify-between gap-2 text-xs text-base-content/60"
          >
            笔刷大小
            <span class="font-mono">{{ brushSize }}px</span>
          </label>
          <input
            v-if="tool !== 'magic-eraser'"
            v-model.number="brushSize"
            type="range"
            min="4"
            max="120"
            step="2"
            class="range range-primary range-xs mt-1 w-full"
            :disabled="!hasImage || processing"
          />

          <label
            v-if="tool === 'bg-eraser' || tool === 'magic-eraser'"
            class="mt-3 flex items-center justify-between gap-2 text-xs text-base-content/60"
          >
            容差
            <span class="font-mono">{{ tolerance }}</span>
          </label>
          <input
            v-if="tool === 'bg-eraser' || tool === 'magic-eraser'"
            v-model.number="tolerance"
            type="range"
            min="0"
            max="100"
            step="1"
            class="range range-primary range-xs mt-1 w-full"
            :disabled="!hasImage || processing"
          />
          <p class="mt-3 text-[11px] leading-relaxed text-base-content/40">
            Ctrl+Z 撤回 · Ctrl+Shift+Z / Ctrl+Y 重做
          </p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-2 w-full bg-base-content/5"
            :disabled="!canUndo || processing"
            @click="undo"
          >
            撤回上一步
          </button>
        </section>

        <section class="overflow-hidden rounded-2xl tool-panel p-4">
          <p class="mb-3 text-sm font-semibold text-base-content">导出</p>
          <div
            class="mb-3 rounded-xl bg-base-content/[0.04] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-base-content/70"
          >
            <div class="flex justify-between gap-2">
              <span class="text-base-content/45">尺寸</span>
              <span>{{ canvasWidth }}×{{ canvasHeight }} px</span>
            </div>
            <div class="mt-1 flex justify-between gap-2">
              <span class="text-base-content/45">PNG 大小</span>
              <span>{{ outputFileSize ? formatBytes(outputFileSize) : '计算中…' }}</span>
            </div>
            <div
              v-if="sourceFileSize"
              class="mt-1 flex justify-between gap-2 border-t border-base-content/10 pt-1.5"
            >
              <span class="text-base-content/45">原图</span>
              <span>{{ formatBytes(sourceFileSize) }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="!hasImage || processing"
              @click="exportPng"
            >
              下载透明 PNG
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm bg-base-content/5"
              :disabled="!hasImage || processing"
              @click="previewPng"
            >
              预览输出
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm bg-base-content/5"
              :disabled="processing"
              @click="resetAll"
            >
              重选图片
            </button>
          </div>
        </section>
      </aside>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp"
      class="sr-only"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '✂️在线抠图',
  group: '媒体类',
  ssr: false,
});

import { ElMessage } from 'element-plus';

const fileInput = ref<HTMLInputElement | null>(null);
const viewCanvas = ref<HTMLCanvasElement | null>(null);

const isDragging = ref(false);
const hasImage = ref(false);
const hasResult = ref(false);
const processing = ref(false);
const stage = ref<'idle' | 'ai' | 'brush'>('idle');
const loadingText = ref('');
const sourceFileSize = ref(0);
const outputFileSize = ref(0);
const canvasWidth = ref(0);
const canvasHeight = ref(0);

type ToolId = 'eraser' | 'bg-eraser' | 'magic-eraser' | 'restore';

const tool = ref<ToolId>('eraser');
const brushSize = ref(24);
const tolerance = ref(32);
const canUndo = ref(false);
const canRedo = ref(false);

const toolOptions: { id: ToolId; label: string; hint: string; icon: string }[] = [
  {
    id: 'eraser',
    label: '橡皮擦',
    hint: '涂抹处直接变透明',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5l3 3-9.75 9.75H6.75v-3L16.5 4.5z"/><path stroke-linecap="round" d="M5 19.5h14"/></svg>`,
  },
  {
    id: 'bg-eraser',
    label: '背景橡皮擦',
    hint: '按笔心颜色擦相近色',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5l3 3-9.75 9.75H6.75v-3L16.5 4.5z"/><path stroke-linecap="round" d="M5 19.5h14"/><rect x="3.2" y="3.2" width="5.2" height="5.2" rx="0.6" fill="currentColor" opacity="0.25" stroke="currentColor" stroke-width="1"/><path d="M4 5.2h3.6M5.8 3.8v3.6" stroke-width="0.9" opacity="0.7"/></svg>`,
  },
  {
    id: 'magic-eraser',
    label: '魔术橡皮擦',
    hint: '单击清除连续相近色',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5l3 3-9.75 9.75H6.75v-3L16.5 4.5z"/><path stroke-linecap="round" d="M5 19.5h14"/><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 5.2l.7 1.5 1.6.3-1.2 1.1.4 1.6-1.5-.8-1.5.8.4-1.6-1.2-1.1 1.6-.3.7-1.5z" fill="currentColor" stroke="none"/></svg>`,
  },
  {
    id: 'restore',
    label: '恢复前景',
    hint: '从原图补回被擦区域',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15l-3-3m0 0l3-3m-3 3h9a4 4 0 010 8h-1"/></svg>`,
  },
];

let sourceImage: HTMLImageElement | null = null;
let sourceObjectUrl = '';
/** 当前可编辑结果（含透明） */
let workCanvas: HTMLCanvasElement | null = null;
/** 原图像素，用于恢复 */
let originCanvas: HTMLCanvasElement | null = null;
let drawing = false;
let lastX = 0;
let lastY = 0;

const MAX_HISTORY = 20;
let undoStack: ImageData[] = [];
let redoStack: ImageData[] = [];
let outputMetaTimer: ReturnType<typeof setTimeout> | null = null;
let outputMetaSeq = 0;

onMounted(() => {
  window.addEventListener('paste', onPaste);
  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste);
  window.removeEventListener('keydown', onKeyDown);
  revokeSource();
  clearHistory();
  if (outputMetaTimer) clearTimeout(outputMetaTimer);
});

watch(viewCanvas, el => {
  if (el && workCanvas) {
    syncViewCanvas();
    paintView();
  }
});

function updateHistoryFlags() {
  canUndo.value = undoStack.length > 0;
  canRedo.value = redoStack.length > 0;
}

function clearHistory() {
  undoStack = [];
  redoStack = [];
  updateHistoryFlags();
}

function cloneWorkImageData(): ImageData | null {
  if (!workCanvas) return null;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true })!;
  return ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
}

/** 在修改画布前调用：保存当前状态以便撤回 */
function pushHistory() {
  const snap = cloneWorkImageData();
  if (!snap) return;
  undoStack.push(snap);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryFlags();
}

function restoreImageData(data: ImageData) {
  if (!workCanvas) return;
  workCanvas.getContext('2d')!.putImageData(data, 0, 0);
  paintView();
}

function undo() {
  if (!workCanvas || undoStack.length === 0 || processing.value) return;
  const current = cloneWorkImageData();
  if (current) redoStack.push(current);
  const prev = undoStack.pop()!;
  restoreImageData(prev);
  updateHistoryFlags();
}

function redo() {
  if (!workCanvas || redoStack.length === 0 || processing.value) return;
  const current = cloneWorkImageData();
  if (current) {
    undoStack.push(current);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
  }
  const next = redoStack.pop()!;
  restoreImageData(next);
  updateHistoryFlags();
}

function onKeyDown(e: KeyboardEvent) {
  if (!hasImage.value || processing.value) return;
  const tag = (e.target as HTMLElement | null)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (!(e.ctrlKey || e.metaKey)) return;

  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undo();
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    e.preventDefault();
    redo();
  }
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) loadFile(file);
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
}

function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        loadFile(file);
        ElMessage.success('已从剪贴板获取图片');
      }
      return;
    }
  }
}

function revokeSource() {
  if (sourceObjectUrl) {
    URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = '';
  }
}

async function loadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件');
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    ElMessage.warning('图片过大，建议小于 12MB');
    return;
  }

  revokeSource();
  sourceObjectUrl = URL.createObjectURL(file);
  sourceFileSize.value = file.size;
  outputFileSize.value = 0;
  hasResult.value = false;
  tool.value = 'eraser';
  clearHistory();

  try {
    const img = await loadImage(sourceObjectUrl);
    sourceImage = img;
    canvasWidth.value = img.naturalWidth;
    canvasHeight.value = img.naturalHeight;
    initWorkCanvases(img);

    // 先挂载画布 DOM，再同步尺寸并绘制（避免 nextTick 早于渲染导致空白）
    hasImage.value = true;
    await nextTick();
    syncViewCanvas();
    paintView();
  } catch {
    ElMessage.error('图片加载失败');
  }
}

function initWorkCanvases(img: HTMLImageElement) {
  originCanvas = document.createElement('canvas');
  originCanvas.width = img.naturalWidth;
  originCanvas.height = img.naturalHeight;
  const octx = originCanvas.getContext('2d')!;
  octx.drawImage(img, 0, 0);

  workCanvas = document.createElement('canvas');
  workCanvas.width = img.naturalWidth;
  workCanvas.height = img.naturalHeight;
  const wctx = workCanvas.getContext('2d')!;
  wctx.clearRect(0, 0, workCanvas.width, workCanvas.height);
  wctx.drawImage(img, 0, 0);
}

function syncViewCanvas() {
  const vc = viewCanvas.value;
  if (!vc || !workCanvas) return;
  if (vc.width !== workCanvas.width || vc.height !== workCanvas.height) {
    vc.width = workCanvas.width;
    vc.height = workCanvas.height;
  }
}

function paintView() {
  const vc = viewCanvas.value;
  if (!vc || !workCanvas) return;
  syncViewCanvas();
  const ctx = vc.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, vc.width, vc.height);
  ctx.drawImage(workCanvas, 0, 0);
  scheduleOutputMeta();
}

/** 防抖估算当前透明 PNG 体积 */
function scheduleOutputMeta() {
  if (outputMetaTimer) clearTimeout(outputMetaTimer);
  outputMetaTimer = setTimeout(() => {
    void refreshOutputMeta();
  }, 280);
}

function workCanvasToPngBlob(): Promise<Blob | null> {
  return new Promise(resolve => {
    if (!workCanvas) {
      resolve(null);
      return;
    }
    workCanvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

async function refreshOutputMeta() {
  if (!workCanvas) {
    outputFileSize.value = 0;
    return;
  }
  const seq = ++outputMetaSeq;
  const blob = await workCanvasToPngBlob();
  if (seq !== outputMetaSeq) return;
  outputFileSize.value = blob?.size ?? 0;
}

async function runAiMatting() {
  if (!sourceImage || processing.value) return;
  processing.value = true;
  stage.value = 'ai';
  loadingText.value = '正在准备模型 / 抠图，请稍候…';

  try {
    const { removeImageBackground } = await import(
      '~/utils/remove-background.client'
    );
    loadingText.value = 'AI 正在识别主体…';
    // 库不接受 HTMLImageElement，需 Blob；优先用原图 objectURL 对应文件流
    const inputBlob = await (async () => {
      if (!sourceObjectUrl) return sourceImage!;
      const res = await fetch(sourceObjectUrl);
      return res.blob();
    })();
    const blob = await removeImageBackground(inputBlob, {
      device: 'cpu',
      progress: (_key: string, current: number, total: number) => {
        if (!total) return;
        const pct = Math.round((current / total) * 100);
        loadingText.value = `处理中 ${pct}%`;
      },
    });

    const resultUrl = URL.createObjectURL(blob);
    const resultImg = await loadImage(resultUrl);
    URL.revokeObjectURL(resultUrl);

    if (!workCanvas) return;
    pushHistory();
    const wctx = workCanvas.getContext('2d')!;
    wctx.clearRect(0, 0, workCanvas.width, workCanvas.height);
    wctx.drawImage(resultImg, 0, 0, workCanvas.width, workCanvas.height);
    hasResult.value = true;
    paintView();
    ElMessage.success('抠图完成，可用画笔精修');
  } catch (err: any) {
    console.error(err);
    ElMessage.error(err?.message || 'AI 抠图失败，请换图重试或检查网络');
  } finally {
    processing.value = false;
    stage.value = 'idle';
    loadingText.value = '';
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('结果图加载失败'));
    img.src = src;
  });
}

function canvasPoint(e: PointerEvent) {
  const vc = viewCanvas.value;
  if (!vc) return null;
  const rect = vc.getBoundingClientRect();
  const scaleX = vc.width / rect.width;
  const scaleY = vc.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function onPointerDown(e: PointerEvent) {
  if (!hasImage.value || !workCanvas || processing.value) return;
  const pt = canvasPoint(e);
  if (!pt) return;

  if (tool.value === 'magic-eraser') {
    magicEraseAt(Math.round(pt.x), Math.round(pt.y));
    return;
  }

  pushHistory();
  drawing = true;
  lastX = pt.x;
  lastY = pt.y;
  (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
  stroke(pt.x, pt.y, pt.x, pt.y);
}

function onPointerMove(e: PointerEvent) {
  if (!drawing || tool.value === 'magic-eraser') return;
  const pt = canvasPoint(e);
  if (!pt) return;
  stroke(lastX, lastY, pt.x, pt.y);
  lastX = pt.x;
  lastY = pt.y;
}

function onPointerUp() {
  drawing = false;
}

/** 容差 0–100 → RGB 欧氏距离阈值 */
function toleranceThreshold() {
  return (tolerance.value / 100) * Math.sqrt(3 * 255 * 255);
}

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function stroke(x0: number, y0: number, x1: number, y1: number) {
  if (!workCanvas || !originCanvas) return;
  const r = brushSize.value / 2;
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / Math.max(r * 0.35, 1)));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    if (tool.value === 'eraser') {
      stampEraser(x, y, r);
    } else if (tool.value === 'bg-eraser') {
      stampBgEraser(x, y, r);
    } else if (tool.value === 'restore') {
      stampRestore(x, y, r);
    }
  }
  paintView();
  hasResult.value = true;
}

/** 普通橡皮擦：圆形区域 destination-out */
function stampEraser(x: number, y: number, r: number) {
  if (!workCanvas) return;
  const ctx = workCanvas.getContext('2d')!;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 恢复：从原图圆形裁切贴回 */
function stampRestore(x: number, y: number, r: number) {
  if (!workCanvas || !originCanvas) return;
  const ctx = workCanvas.getContext('2d')!;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(originCanvas, 0, 0);
  ctx.restore();
}

/**
 * 背景橡皮擦：以笔刷中心颜色为采样，擦掉圆内相近色（非连续，类似 PS Discontiguous）
 */
function stampBgEraser(cx: number, cy: number, r: number) {
  if (!workCanvas) return;
  const w = workCanvas.width;
  const h = workCanvas.height;
  const ctx = workCanvas.getContext('2d', { willReadFrequently: true })!;

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(w, Math.ceil(cx + r));
  const y1 = Math.min(h, Math.ceil(cy + r));
  const bw = x1 - x0;
  const bh = y1 - y0;
  if (bw <= 0 || bh <= 0) return;

  const sx = Math.min(w - 1, Math.max(0, Math.round(cx)));
  const sy = Math.min(h - 1, Math.max(0, Math.round(cy)));
  const sample = ctx.getImageData(sx, sy, 1, 1).data;
  // 笔心已透明则跳过本次采样
  if (sample[3] < 8) return;

  const thr = toleranceThreshold();
  const img = ctx.getImageData(x0, y0, bw, bh);
  const d = img.data;
  const r2 = r * r;

  for (let py = 0; py < bh; py++) {
    for (let px = 0; px < bw; px++) {
      const dx = x0 + px + 0.5 - cx;
      const dy = y0 + py + 0.5 - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = (py * bw + px) * 4;
      if (d[i + 3] < 8) continue;
      if (colorDistance(d[i], d[i + 1], d[i + 2], sample[0], sample[1], sample[2]) <= thr) {
        d[i + 3] = 0;
      }
    }
  }
  ctx.putImageData(img, x0, y0);
}

/**
 * 魔术橡皮擦：从点击处洪水填充擦除连续相近色
 */
function magicEraseAt(sx: number, sy: number) {
  if (!workCanvas) return;
  const w = workCanvas.width;
  const h = workCanvas.height;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;

  const ctx = workCanvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const start = (sy * w + sx) * 4;
  if (d[start + 3] < 8) return;

  const tr = d[start];
  const tg = d[start + 1];
  const tb = d[start + 2];
  const thr = toleranceThreshold();
  const visited = new Uint8Array(w * h);
  const stack: number[] = [sx, sy];
  visited[sy * w + sx] = 1;
  let erased = 0;

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const i = (y * w + x) * 4;
    if (d[i + 3] < 8) continue;
    if (colorDistance(d[i], d[i + 1], d[i + 2], tr, tg, tb) > thr) continue;

    d[i + 3] = 0;
    erased++;

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ] as const;
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (visited[ni]) continue;
      visited[ni] = 1;
      stack.push(nx, ny);
    }
  }

  if (erased > 0) {
    pushHistory();
    ctx.putImageData(img, 0, 0);
    paintView();
    hasResult.value = true;
  }
}

async function exportPng() {
  if (!workCanvas) return;
  const blob = await workCanvasToPngBlob();
  if (!blob) {
    ElMessage.error('导出失败');
    return;
  }
  outputFileSize.value = blob.size;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `matting-${canvasWidth.value}x${canvasHeight.value}-${Date.now()}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
  ElMessage.success(
    `已导出 ${canvasWidth.value}×${canvasHeight.value} · ${formatBytes(blob.size)}`
  );
}

async function previewPng() {
  if (!workCanvas) return;
  const blob = await workCanvasToPngBlob();
  if (!blob) {
    ElMessage.error('预览失败');
    return;
  }
  outputFileSize.value = blob.size;
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    ElMessage.warning('浏览器拦截了弹窗，请允许后重试');
    return;
  }
  // 延迟释放，给新标签页加载时间
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  ElMessage.info(
    `预览 ${canvasWidth.value}×${canvasHeight.value} · ${formatBytes(blob.size)}`
  );
}

function resetAll() {
  revokeSource();
  sourceImage = null;
  workCanvas = null;
  originCanvas = null;
  hasImage.value = false;
  hasResult.value = false;
  sourceFileSize.value = 0;
  outputFileSize.value = 0;
  canvasWidth.value = 0;
  canvasHeight.value = 0;
  drawing = false;
  clearHistory();
}
</script>

<style scoped>
.checker {
  background-color: color-mix(in oklab, var(--color-base-200) 80%, transparent);
  background-image:
    linear-gradient(45deg, color-mix(in oklab, var(--color-base-content) 8%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in oklab, var(--color-base-content) 8%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in oklab, var(--color-base-content) 8%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in oklab, var(--color-base-content) 8%, transparent) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.view-canvas {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: min(60vh, 560px);
}

.image-matting :deep(.tool-panel) {
  border: 1px solid color-mix(in oklab, var(--color-base-content) 22%, transparent);
}

.tool-icon {
  display: inline-flex;
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
  opacity: 0.9;
}

.tool-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
