<template>
  <div class="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        SVG 预览
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        粘贴代码即时预览，可导出 PNG 或 SVG
      </p>
    </header>

    <section
      class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/50 px-4 py-3 sm:px-5">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="!svgCode.trim()"
            @click="parseSvg">
            预览
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-base-300"
            :disabled="!parsedSvg"
            @click="saveFile('png')">
            导出 PNG
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-base-300"
            :disabled="!parsedSvg"
            @click="saveFile('svg')">
            导出 SVG
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="!svgCode && !parsedSvg && !error"
            @click="clearAll">
            清空
          </button>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-xs text-base-content/60">
          <input v-model="livePreview" type="checkbox" class="toggle toggle-xs toggle-primary" />
          实时预览
        </label>
      </div>

      <div class="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:divide-x lg:divide-base-300/50">
        <div class="flex min-h-[min(52vh,520px)] flex-col p-4 sm:p-5">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-base-content">SVG 代码</span>
            <span class="font-mono text-[11px] text-base-content/40">
              {{ lineCount }} 行
            </span>
          </div>
          <textarea
            v-model="svgCode"
            class="textarea textarea-bordered min-h-0 flex-1 w-full resize-none font-mono text-sm leading-relaxed"
            placeholder="粘贴或输入以 <svg> 开头的代码…"
            spellcheck="false"
            @keydown.ctrl.enter.prevent="parseSvg"
            @keydown.meta.enter.prevent="parseSvg" />
        </div>

        <div class="flex min-h-[min(52vh,520px)] flex-col p-4 sm:p-5">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-base-content">预览</span>
            <span v-if="parsedSvg && !error" class="text-[11px] text-success/80">就绪</span>
          </div>
          <div
            class="preview-stage relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border border-dashed border-base-300/70 p-4">
            <div
              v-if="error"
              class="max-w-sm rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-center text-sm text-error">
              {{ error }}
            </div>
            <div
              v-else-if="parsedSvg"
              class="preview-svg flex max-h-full max-w-full items-center justify-center"
              v-html="parsedSvg" />
            <p v-else class="px-4 text-center text-xs text-base-content/40">
              输入 SVG 后点击预览，或开启实时预览
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';

const svgCode = ref(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" stroke-width="8"/>
  <path d="M40 62 L54 76 L82 44" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);
const parsedSvg = ref('');
const error = ref('');
const livePreview = ref(true);
let previewTimer: ReturnType<typeof setTimeout> | null = null;

const lineCount = computed(() => {
  if (!svgCode.value) return 0;
  return svgCode.value.split('\n').length;
});

function parseSvg() {
  error.value = '';
  try {
    const raw = svgCode.value.trim();
    if (!raw) {
      throw new Error('请输入 SVG 代码');
    }

    if (!/^\s*<svg[\s>]/i.test(raw)) {
      throw new Error('必须以 <svg> 标签开头');
    }
    if (!/<\/svg>\s*$/i.test(raw)) {
      throw new Error('必须以 </svg> 标签结尾');
    }

    const sanitized = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*(["'])[\s\S]*?\1/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/</g, '&lt;'));

    parsedSvg.value = sanitized;
  } catch (err: any) {
    error.value = '解析失败：' + (err?.message || String(err));
    parsedSvg.value = '';
  }
}

function scheduleLivePreview() {
  if (!livePreview.value) return;
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (!svgCode.value.trim()) {
      parsedSvg.value = '';
      error.value = '';
      return;
    }
    parseSvg();
  }, 280);
}

watch(svgCode, scheduleLivePreview);

watch(livePreview, (on) => {
  if (on) scheduleLivePreview();
});

onMounted(() => {
  parseSvg();
});

onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer);
});

async function saveFile(format: 'png' | 'svg') {
  if (!parsedSvg.value) {
    ElMessage.warning('请先预览有效的 SVG');
    return;
  }
  try {
    if (format === 'png') {
      await saveAsImage();
      ElMessage.success('已导出 PNG');
    } else {
      await saveAsSVG();
      ElMessage.success('已导出 SVG');
    }
  } catch (err: any) {
    error.value = '保存失败: ' + (err?.message || String(err));
    ElMessage.error('保存失败');
  }
}

async function saveAsSVG() {
  const blob = new Blob([parsedSvg.value], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `svg_export_${Date.now()}.svg`;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function saveAsImage() {
  const svgElement = document.createElement('div');
  svgElement.innerHTML = parsedSvg.value;
  const svgNode = svgElement.querySelector('svg');

  if (!svgNode) {
    throw new Error('未找到有效的 SVG 元素');
  }

  if (!svgNode.getAttribute('xmlns')) {
    svgNode.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgNode);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const viewBox = svgNode.getAttribute('viewBox');
    const parts = viewBox ? viewBox.trim().split(/[\s,]+/) : [];
    const vw = parts[2];
    const vh = parts[3];
    const width =
      parseInt(String(svgNode.getAttribute('width') || ''), 10) ||
      parseInt(String(vw || ''), 10) ||
      800;
    const height =
      parseInt(String(svgNode.getAttribute('height') || ''), 10) ||
      parseInt(String(vh || ''), 10) ||
      600;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = () => reject(new Error('SVG 内容无效或包含不安全元素'));
      img.src = url;
    });

    const link = document.createElement('a');
    link.download = `svg_export_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function clearAll() {
  svgCode.value = '';
  parsedSvg.value = '';
  error.value = '';
}
</script>

<style scoped>
.preview-stage {
  background-color: color-mix(in oklab, var(--color-base-200) 70%, transparent);
  background-image:
    linear-gradient(
      45deg,
      color-mix(in oklab, var(--color-base-300) 55%, transparent) 25%,
      transparent 25%
    ),
    linear-gradient(
      -45deg,
      color-mix(in oklab, var(--color-base-300) 55%, transparent) 25%,
      transparent 25%
    ),
    linear-gradient(
      45deg,
      transparent 75%,
      color-mix(in oklab, var(--color-base-300) 55%, transparent) 75%
    ),
    linear-gradient(
      -45deg,
      transparent 75%,
      color-mix(in oklab, var(--color-base-300) 55%, transparent) 75%
    );
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
}

.preview-svg :deep(svg) {
  max-width: 100%;
  max-height: min(48vh, 440px);
  height: auto;
  color: var(--color-base-content);
}
</style>
