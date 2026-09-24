<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end gap-3">
      <div class="form-control min-w-0 flex-1">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">输出格式</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="fmt in formats"
            :key="fmt.value"
            type="button"
            class="btn btn-sm"
            :class="
              outputFormat === fmt.value
                ? 'btn-primary'
                : 'btn-ghost border border-app-strong'
            "
            @click="onFormatChange(fmt.value)"
          >
            {{ fmt.label }}
          </button>
        </div>
      </div>

      <div v-if="outputFormat === 'jpg'" class="form-control w-full sm:w-40">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">
            JPG 质量 {{ Math.round(jpgQuality * 100) }}%
          </span>
        </label>
        <input
          v-model.number="jpgQuality"
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          class="range range-primary range-xs"
          @change="reExportIfReady"
        />
      </div>
    </div>

    <div
      v-if="outputFormat === 'gif'"
      class="flex flex-wrap items-end gap-3 rounded-xl border border-app bg-base-200/30 px-3 py-3"
    >
      <div class="form-control w-[7.5rem]">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">宽度</span>
        </label>
        <input
          v-model.number="gifWidth"
          type="number"
          min="1"
          max="4096"
          class="input input-bordered input-sm w-full"
          placeholder="原宽"
          @change="onGifWidthChange"
        />
      </div>
      <div class="form-control w-[7.5rem]">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">高度</span>
        </label>
        <input
          v-model.number="gifHeight"
          type="number"
          min="1"
          max="4096"
          class="input input-bordered input-sm w-full"
          placeholder="原高"
          @change="onGifHeightChange"
        />
      </div>
      <label class="label cursor-pointer gap-2 py-1 sm:pb-2">
        <input
          v-model="gifKeepRatio"
          type="checkbox"
          class="checkbox checkbox-primary checkbox-sm"
        />
        <span class="label-text text-sm text-base-content/70">锁定比例</span>
      </label>
      <button
        type="button"
        class="btn btn-ghost btn-sm border border-app-strong"
        :disabled="!sourceNatural.w"
        @click="resetGifSize"
      >
        还原原尺寸
      </button>
      <p
        v-if="sourceNatural.w"
        class="w-full text-xs text-base-content/45 sm:ml-auto sm:w-auto"
      >
        原图 {{ sourceNatural.w }}×{{ sourceNatural.h }}
      </p>
    </div>

    <label
      class="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-app-strong bg-base-200/30 px-4 py-10 transition-colors hover:border-primary/50 hover:bg-base-200/50"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <input
        type="file"
        accept=".webp,image/webp"
        class="hidden"
        @change="handleFileUpload"
      />
      <p class="text-sm font-medium text-base-content">
        点击选择 WebP，或拖放到此处
      </p>
      <p class="mt-1 text-xs text-base-content/45">
        支持静态 / 动图；转 GIF 时将尽量保留全部帧
      </p>
    </label>

    <div
      v-if="isLoading"
      class="rounded-lg bg-base-200/60 px-3 py-2 text-center text-sm text-base-content/70"
    >
      {{ loadingText }}
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div v-if="showPreview" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-medium text-base-content">预览</p>
        <p v-if="metaText || sizeText" class="text-xs text-base-content/45">
          <template v-if="metaText">{{ metaText }}</template>
          <template v-if="metaText && sizeText"> · </template>
          <template v-if="sizeText">{{ sizeText }}</template>
        </p>
      </div>

      <div
        class="overflow-hidden rounded-xl border border-app bg-base-200/40 p-3"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="预览"
          class="mx-auto max-h-64 max-w-full rounded-lg object-contain"
        />
        <canvas
          v-else
          ref="previewCanvas"
          class="mx-auto max-h-64 max-w-full rounded-lg"
        />
      </div>

      <a
        v-if="downloadUrl"
        :href="downloadUrl"
        :download="downloadFilename"
        class="btn btn-primary btn-sm"
      >
        下载 {{ outputFormat.toUpperCase() }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
type OutputFormat = 'png' | 'jpg' | 'gif';

type DecodedFrame = {
  image: ImageBitmap | CanvasImageSource;
  durationMs: number;
};

const formats: { value: OutputFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'gif', label: 'GIF' },
];

const outputFormat = ref<OutputFormat>('png');
const jpgQuality = ref(0.92);
const gifWidth = ref<number | null>(null);
const gifHeight = ref<number | null>(null);
const gifKeepRatio = ref(true);
const sourceNatural = reactive({ w: 0, h: 0 });
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewUrl = ref('');
const downloadUrl = ref('');
const downloadFilename = ref('');
const showPreview = ref(false);
const isLoading = ref(false);
const loadingText = ref('转换中…');
const errorMessage = ref('');
const metaText = ref('');
const sourceFile = ref<File | null>(null);
const decodedFrames = ref<DecodedFrame[]>([]);
const outputBytes = ref(0);
const outputDims = reactive({ w: 0, h: 0 });

const sizeText = computed(() => {
  if (!outputBytes.value && !sourceFile.value) return '';
  const out = formatBytes(outputBytes.value);
  const src = sourceFile.value ? formatBytes(sourceFile.value.size) : '';
  const dim =
    outputDims.w && outputDims.h ? `${outputDims.w}×${outputDims.h}` : '';
  const parts: string[] = [];
  if (src && out) parts.push(`原 ${src} → 出 ${out}`);
  else if (out) parts.push(out);
  else if (src) parts.push(`原 ${src}`);
  if (dim && outputFormat.value === 'gif') parts.push(dim);
  return parts.join(' · ');
});

function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function revokeUrls() {
  if (previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
  if (downloadUrl.value.startsWith('blob:')) URL.revokeObjectURL(downloadUrl.value);
  previewUrl.value = '';
  downloadUrl.value = '';
}

function resetState() {
  revokeUrls();
  showPreview.value = false;
  errorMessage.value = '';
  metaText.value = '';
  outputBytes.value = 0;
  decodedFrames.value = [];
  sourceNatural.w = 0;
  sourceNatural.h = 0;
  outputDims.w = 0;
  outputDims.h = 0;
}

function clampDim(n: number) {
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(4096, Math.max(1, Math.round(n)));
}

function onGifWidthChange() {
  const w = clampDim(Number(gifWidth.value));
  gifWidth.value = w;
  if (w && gifKeepRatio.value && sourceNatural.w && sourceNatural.h) {
    gifHeight.value = clampDim((w * sourceNatural.h) / sourceNatural.w);
  }
  reExportIfReady();
}

function onGifHeightChange() {
  const h = clampDim(Number(gifHeight.value));
  gifHeight.value = h;
  if (h && gifKeepRatio.value && sourceNatural.w && sourceNatural.h) {
    gifWidth.value = clampDim((h * sourceNatural.w) / sourceNatural.h);
  }
  reExportIfReady();
}

function resetGifSize() {
  if (!sourceNatural.w) return;
  gifWidth.value = sourceNatural.w;
  gifHeight.value = sourceNatural.h;
  reExportIfReady();
}

function resolveGifSize() {
  const srcW = sourceNatural.w || (decodedFrames.value[0]?.image as ImageBitmap)?.width || 0;
  const srcH = sourceNatural.h || (decodedFrames.value[0]?.image as ImageBitmap)?.height || 0;
  const w = clampDim(Number(gifWidth.value)) || srcW;
  const h = clampDim(Number(gifHeight.value)) || srcH;
  return { w, h, srcW, srcH };
}

function onFormatChange(fmt: OutputFormat) {
  outputFormat.value = fmt;
  if (fmt === 'gif' && sourceNatural.w && (!gifWidth.value || !gifHeight.value)) {
    gifWidth.value = sourceNatural.w;
    gifHeight.value = sourceNatural.h;
  }
  reExportIfReady();
}

async function reExportIfReady() {
  if (!sourceFile.value || !decodedFrames.value.length) return;
  await exportFromFrames(sourceFile.value, decodedFrames.value);
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  await convertFile(input.files?.[0] || null);
}

async function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) await convertFile(file);
}

async function convertFile(file: File | null) {
  if (!file) return;

  const isWebp =
    file.type === 'image/webp' || /\.webp$/i.test(file.name) || !file.type;
  if (!isWebp && file.type && !file.type.startsWith('image/')) {
    errorMessage.value = '请选择 WebP 图片';
    return;
  }

  resetState();
  sourceFile.value = file;
  isLoading.value = true;
  loadingText.value = '解码 WebP…';

  try {
    const buffer = await file.arrayBuffer();
    const frames = await decodeWebpFrames(buffer);
    if (!frames.length) throw new Error('未能解码出有效帧');

    decodedFrames.value = frames;
    const first = frames[0].image as ImageBitmap;
    sourceNatural.w = first.width || 0;
    sourceNatural.h = first.height || 0;
    gifWidth.value = sourceNatural.w || null;
    gifHeight.value = sourceNatural.h || null;

    const size =
      sourceNatural.w && sourceNatural.h
        ? `${sourceNatural.w}×${sourceNatural.h}`
        : '';
    metaText.value =
      frames.length > 1
        ? `${size}${size ? ' · ' : ''}${frames.length} 帧动图`
        : size || '静态图';

    if (
      frames.length === 1 &&
      typeof ImageDecoder === 'undefined' &&
      outputFormat.value === 'gif'
    ) {
      metaText.value += '（当前浏览器仅支持导出首帧 GIF）';
    }

    await exportFromFrames(file, frames);
  } catch (error: any) {
    errorMessage.value = `转换失败：${error?.message || error}`;
  } finally {
    isLoading.value = false;
  }
}

async function decodeWebpFrames(buffer: ArrayBuffer): Promise<DecodedFrame[]> {
  // Chromium ImageDecoder：可抽出动图全部帧
  if (typeof ImageDecoder !== 'undefined') {
    try {
      const decoder = new ImageDecoder({ data: buffer, type: 'image/webp' });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack;
      if (!track) throw new Error('no track');

      // 部分动图需等完整解析才有准确帧数
      if (!track.complete && 'completed' in track) {
        await (track as any).completed;
      }

      const frameCount = Math.max(1, track.frameCount || 1);
      const frames: DecodedFrame[] = [];

      for (let i = 0; i < frameCount; i++) {
        const { image: videoFrame } = await decoder.decode({ frameIndex: i });
        const bitmap = await createImageBitmap(videoFrame);
        const rawDuration = videoFrame.duration ?? 0;
        const durationMs =
          rawDuration > 0
            ? Math.max(20, Math.round(Number(rawDuration) / 1000))
            : 100;
        videoFrame.close();
        frames.push({ image: bitmap, durationMs });
      }

      decoder.close();
      return frames;
    } catch {
      // fall through
    }
  }

  // 回退：仅首帧（静图或无 ImageDecoder 的环境）
  const blob = new Blob([buffer], { type: 'image/webp' });
  const bitmap = await createImageBitmap(blob);
  return [{ image: bitmap, durationMs: 100 }];
}

function drawFrameToCanvas(
  canvas: HTMLCanvasElement,
  frame: DecodedFrame,
  fillWhite = false,
  targetW?: number,
  targetH?: number,
) {
  const img = frame.image as ImageBitmap;
  const w = targetW || img.width;
  const h = targetH || img.height;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (fillWhite) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('导出失败'))),
      type,
      quality,
    );
  });
}

async function exportFromFrames(file: File, frames: DecodedFrame[]) {
  isLoading.value = true;
  loadingText.value =
    outputFormat.value === 'gif' && frames.length > 1
      ? `编码 GIF（${frames.length} 帧）…`
      : '导出中…';
  errorMessage.value = '';

  try {
    revokeUrls();
    const baseName = file.name.replace(/\.webp$/i, '') || 'image';
    const canvas = document.createElement('canvas');

    if (outputFormat.value === 'png') {
      drawFrameToCanvas(canvas, frames[0], false);
      const blob = await canvasToBlob(canvas, 'image/png');
      const img = frames[0].image as ImageBitmap;
      outputDims.w = img.width;
      outputDims.h = img.height;
      setResult(blob, `${baseName}.png`, frames[0]);
      return;
    }

    if (outputFormat.value === 'jpg') {
      drawFrameToCanvas(canvas, frames[0], true);
      const blob = await canvasToBlob(canvas, 'image/jpeg', jpgQuality.value);
      const img = frames[0].image as ImageBitmap;
      outputDims.w = img.width;
      outputDims.h = img.height;
      setResult(blob, `${baseName}.jpg`, frames[0]);
      return;
    }

    // GIF
    const { w, h } = resolveGifSize();
    const blob = await encodeGif(frames);
    outputDims.w = w;
    outputDims.h = h;
    setResult(blob, `${baseName}.gif`, frames[0], true);
  } catch (error: any) {
    errorMessage.value = `导出失败：${error?.message || error}`;
    showPreview.value = false;
  } finally {
    isLoading.value = false;
  }
}

function setResult(
  blob: Blob,
  filename: string,
  firstFrame: DecodedFrame,
  useBlobPreview = false,
) {
  const url = URL.createObjectURL(blob);
  downloadUrl.value = url;
  downloadFilename.value = filename;
  outputBytes.value = blob.size;
  showPreview.value = true;

  if (useBlobPreview || outputFormat.value === 'gif') {
    previewUrl.value = url;
  } else {
    previewUrl.value = '';
    nextTick(() => {
      const el = previewCanvas.value;
      if (el) drawFrameToCanvas(el, firstFrame, outputFormat.value === 'jpg');
    });
  }
}

function encodeGif(frames: DecodedFrame[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const GIF = (window as any).GIF;
    if (!GIF) {
      reject(new Error('GIF.js 未加载，请刷新页面后重试'));
      return;
    }

    const { w, h } = resolveGifSize();
    if (!w || !h) {
      reject(new Error('请设置有效的宽高'));
      return;
    }

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: w,
      height: h,
      workerScript: '/gif.worker.js',
    });

    for (const frame of frames) {
      const canvas = document.createElement('canvas');
      drawFrameToCanvas(canvas, frame, false, w, h);
      gif.addFrame(canvas.getContext('2d')!, {
        delay: frame.durationMs,
        copy: true,
      });
    }

    gif.on('finished', (blob: Blob) => resolve(blob));
    gif.on('abort', () => reject(new Error('GIF 编码已取消')));
    try {
      gif.render();
    } catch (e) {
      reject(e);
    }
  });
}

onUnmounted(() => {
  revokeUrls();
  for (const f of decodedFrames.value) {
    (f.image as ImageBitmap).close?.();
  }
});
</script>
