<template>
  <div class="mx-auto w-full max-w-6xl px-1 sm:px-2">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        图片去黑边
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        框选 → 粗略裁剪 → 微调 → 导出
      </p>
    </header>

    <!-- 空状态 -->
    <div v-if="!imgBaseUrl" class="mx-auto w-full max-w-lg">
      <div
        class="bg-container is-empty relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-base-300/60 shadow-lg"
        :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-base-100': isDragging }" v-loading="loading"
        @dragenter.prevent="onDragEnter" @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop">
        <div class="px-bg"></div>
        <label
          class="upload-zone absolute inset-3 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 text-center transition-colors sm:inset-4"
          :class="isDragging
            ? 'border-primary bg-primary/10'
            : 'border-base-content/25 hover:border-primary hover:bg-base-100/40'">
          <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </span>
          <span class="text-base font-medium text-base-content">
            {{ isDragging ? '松开即可上传' : '点击或拖拽图片到此处' }}
          </span>
          <span class="text-xs text-base-content/50">支持 PNG / JPG / JPEG</span>
          <input ref="fileInput" type="file" class="sr-only" accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            @change="fileChange" />
        </label>
      </div>
    </div>

    <!-- 有图：预览 + 操作面板 -->
    <div v-else class="flex w-full flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
      <!-- 左侧：原图选区 -->
      <div class="flex min-w-0 w-full flex-1 flex-col">
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-base-content">原图选区</span>
          <span v-if="sourceWidth" class="font-mono text-[11px] text-base-content/50">
            {{ sourceWidth }}×{{ sourceHeight }}
            <template v-if="sourceFileSize"> · {{ formatBytes(sourceFileSize) }}</template>
          </span>
        </div>
        <div
          class="bg-container has-image relative flex w-full items-center justify-center rounded-2xl border border-base-300/60 shadow-lg"
          v-loading="loading">
          <div class="px-bg"></div>
          <div class="mask-bg"></div>
          <div class="preview-container has-img">
            <img :src="imgBaseUrl" alt="" class="preview-img" />
            <div class="cut-wrapper">
              <div class="cropper-crop-box" :style="{
                width: moveElWidth + 'px',
                height: moveElHeight + 'px',
                transform: `translate3d(${translateX}px, ${translateY}px, 0px)`,
              }">
                <span class="cropper-face" @mousedown="handleMoveEl" @touchstart.prevent="handleMoveEl"></span>
                <span class="crop-info">
                  {{ parseInt(moveElWidth) }} × {{ parseInt(moveElHeight) }}
                </span>
                <span>
                  <span class="crop-line line-n" @mousedown="handleLineDown($event, 'n')"
                    @touchstart.prevent="handleLineDown($event, 'n')"></span>
                  <span class="crop-line line-w" @mousedown="handleLineDown($event, 'w')"
                    @touchstart.prevent="handleLineDown($event, 'w')"></span>
                  <span class="crop-line line-s" @mousedown="handleLineDown($event, 's')"
                    @touchstart.prevent="handleLineDown($event, 's')"></span>
                  <span class="crop-line line-e" @mousedown="handleLineDown($event, 'e')"
                    @touchstart.prevent="handleLineDown($event, 'e')"></span>
                  <span class="crop-point point1 nw" @mousedown="handleLineDown($event, 'nw')"
                    @touchstart.prevent="handleLineDown($event, 'nw')"></span>
                  <span class="crop-point point2 n" @mousedown="handleLineDown($event, 'n')"
                    @touchstart.prevent="handleLineDown($event, 'n')"></span>
                  <span class="crop-point point3 ne" @mousedown="handleLineDown($event, 'ne')"
                    @touchstart.prevent="handleLineDown($event, 'ne')"></span>
                  <span class="crop-point point4 w" @mousedown="handleLineDown($event, 'w')"
                    @touchstart.prevent="handleLineDown($event, 'w')"></span>
                  <span class="crop-point point5 e" @mousedown="handleLineDown($event, 'e')"
                    @touchstart.prevent="handleLineDown($event, 'e')"></span>
                  <span class="crop-point point6 sw" @mousedown="handleLineDown($event, 'sw')"
                    @touchstart.prevent="handleLineDown($event, 'sw')"></span>
                  <span class="crop-point point7 s" @mousedown="handleLineDown($event, 's')"
                    @touchstart.prevent="handleLineDown($event, 's')"></span>
                  <span class="crop-point point8 se" @mousedown="handleLineDown($event, 'se')"
                    @touchstart.prevent="handleLineDown($event, 'se')"></span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-2 text-center text-[11px] text-base-content/50 sm:text-xs">
          拖动选区 / 拖角点调整范围 · 松手后自动检测黑边
        </p>
        <div class="mt-3 flex gap-2 sm:hidden">
          <button class="btn btn-primary btn-sm flex-1" :disabled="loading" @click="handleCut">
            {{ loading ? '处理中…' : '粗略裁剪' }}
          </button>
          <button class="btn btn-ghost btn-sm shrink-0 border border-base-300" @click="reset">
            重选
          </button>
        </div>
      </div>

      <!-- 右侧：流水线操作 -->
      <aside class="w-full shrink-0 lg:sticky lg:top-4 lg:w-80 xl:w-96">
        <div
          class="pipeline rounded-2xl border border-base-300/60 bg-base-100/90 p-4 shadow-lg backdrop-blur-sm sm:p-5">
          <div class="mb-4 flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-base-content">处理流水线</h2>
            <button type="button" class="btn btn-ghost btn-xs border border-base-300" @click="reset">
              重选图片
            </button>
          </div>

          <ol class="pipeline-list">
            <!-- Step 1 -->
            <li class="pipeline-step" :class="{ 'is-done': !!outputWidth, 'is-active': !outputWidth }">
              <div class="pipeline-rail" aria-hidden="true">
                <span class="pipeline-dot">1</span>
                <span class="pipeline-line"></span>
              </div>
              <div class="pipeline-body">
                <div class="pipeline-head">
                  <span class="pipeline-title">粗略裁剪</span>
                  <span class="pipeline-hint">检测上下黑边</span>
                </div>
                <div class="hidden gap-2 sm:flex">
                  <button class="btn btn-primary btn-sm flex-1" :disabled="loading" @click="handleCut">
                    {{ loading ? '处理中…' : outputWidth ? '重新检测' : '开始裁剪' }}
                  </button>
                </div>
                <p class="mt-1.5 text-[11px] leading-snug text-base-content/45 sm:hidden">
                  请使用上方按钮完成粗略裁剪
                </p>
              </div>
            </li>

            <!-- Step 2 -->
            <li class="pipeline-step" :class="{
              'is-done': !!outputWidth,
              'is-active': !!outputWidth,
              'is-locked': !outputWidth,
            }">
              <div class="pipeline-rail" aria-hidden="true">
                <span class="pipeline-dot">2</span>
                <span class="pipeline-line"></span>
              </div>
              <div class="pipeline-body">
                <div class="pipeline-head">
                  <span class="pipeline-title">预览核对</span>
                  <span v-if="outputWidth" class="badge badge-ghost badge-sm font-mono">
                    {{ outputWidth }}×{{ outputHeight }}
                  </span>
                  <span v-else class="pipeline-hint">待生成</span>
                </div>

                <button type="button"
                  class="result-img-container group relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-base-300 bg-white p-2 text-left sm:h-40 sm:p-3"
                  :class="resultPreviewUrl ? 'cursor-zoom-in hover:border-primary/50' : 'cursor-default opacity-70'"
                  :disabled="!resultPreviewUrl" @click="openPreviewDialog">
                  <img v-if="resultPreviewUrl" :src="resultPreviewUrl" alt="裁剪结果"
                    class="max-h-full max-w-full object-contain" />
                  <span v-else class="px-3 text-center text-xs text-base-content/40">
                    {{ loading ? '生成预览中…' : '完成步骤 1 后显示结果' }}
                  </span>
                  <span v-if="resultPreviewUrl"
                    class="pointer-events-none absolute bottom-2 right-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    点击放大
                  </span>
                </button>


              </div>
            </li>

            <!-- Step 3 -->
            <li class="pipeline-step" :class="{
              'is-done': customTop !== 0 || customBottom !== 0,
              'is-active': !!outputWidth,
              'is-locked': !outputWidth,
            }">
              <div class="pipeline-rail" aria-hidden="true">
                <span class="pipeline-dot">3</span>
                <span class="pipeline-line"></span>
              </div>
              <div class="pipeline-body">
                <div class="pipeline-head">
                  <span class="pipeline-title">边缘微调</span>
                  <button v-if="outputWidth && (customTop !== 0 || customBottom !== 0)" type="button"
                    class="btn btn-ghost btn-xs text-base-content/50" @click="resetCustom">
                    重置
                  </button>
                  <span v-else class="pipeline-hint">±40px</span>
                </div>

                <template v-if="outputWidth">
                  <div class="grid grid-cols-2 gap-2.5">
                    <label class="flex flex-col gap-1 text-xs text-base-content/70">
                      <span>上边 {{ customTop > 0 ? '多裁' : customTop < 0 ? '少裁' : '' }}</span>
                          <el-input-number v-model="customTop" class="!w-full" :min="-40" :max="40" :step="1"
                            size="small" />
                        </label>
                        <label class="flex flex-col gap-1 text-xs text-base-content/70">
                          <span>下边 {{ customBottom > 0 ? '多裁' : customBottom < 0 ? '少裁' : '' }}</span>
                          <el-input-number v-model="customBottom" class="!w-full" :min="-40" :max="40" :step="1"
                            size="small" />
                    </label>
                  </div>
                  <p class="mt-1.5 text-[11px] leading-snug text-base-content/45">
                    正数多裁，负数少裁；改完自动刷新预览
                  </p>
                </template>
                <p v-else class="text-[11px] text-base-content/40">先完成粗略裁剪</p>
              </div>
            </li>

            <!-- Step 4 -->
            <li class="pipeline-step is-last" :class="{
              'is-active': !!outputWidth,
              'is-locked': !outputWidth,
            }">
              <div class="pipeline-rail" aria-hidden="true">
                <span class="pipeline-dot">4</span>
              </div>
              <div class="pipeline-body">
                <div class="pipeline-head">
                  <span class="pipeline-title">导出保存</span>
                  <span class="pipeline-hint">选格式后下载</span>
                </div>

                <template v-if="outputWidth">
                  <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    <label v-for="opt in exportFormatOptions" :key="opt.value" class="cursor-pointer">
                      <input v-model="exportFormat" type="radio" class="peer hidden" name="export-format"
                        :value="opt.value" />
                      <span class="btn btn-ghost btn-xs w-full border border-base-300 peer-checked:btn-primary">
                        {{ opt.label }}
                      </span>
                    </label>
                  </div>
                  <div v-if="exportFormat !== 'png'" class="mt-2 space-y-1">
                    <div class="flex justify-between text-xs text-base-content/60">
                      <span>画质</span>
                      <span class="font-mono">{{ Math.round(exportQuality * 100) }}%</span>
                    </div>
                    <input v-model.number="exportQuality" type="range" min="0.7" max="0.98" step="0.01"
                      class="range range-primary range-xs w-full" />
                  </div>
                
                  <div v-if="sourceWidth && outputWidth"
                    class="mt-2 space-y-1 rounded-lg bg-base-200/60 px-2.5 py-2 text-[11px]">
                    <div class="flex justify-between gap-2 text-base-content/70">
                      <span>原图</span>
                      <span class="truncate font-mono text-base-content">
                        {{ sourceWidth }}×{{ sourceHeight }} · {{ formatBytes(sourceFileSize) }}
                        <span class="text-base-content/50">({{ sourceExtLabel }})</span>
                      </span>
                    </div>
                    <div class="flex justify-between gap-2 text-base-content/70">
                      <span>输出</span>
                      <span class="truncate font-mono text-base-content">
                        {{ outputWidth }}×{{ outputHeight }} · {{ formatBytes(outputFileSize) }}
                        <span class="text-base-content/50">({{ outputExtLabel }})</span>
                      </span>
                    </div>
                    <div v-if="sizeSavedLabel" class="border-t border-base-300/40 pt-1 text-success">
                      {{ sizeSavedLabel }}
                    </div>
                  </div>

                  <button class="btn btn-success btn-sm mt-3 w-full sm:btn-md" :disabled="loading" @click="save">
                    保存图片
                  </button>
                </template>
                <p v-else class="text-[11px] text-base-content/40">先完成粗略裁剪</p>
              </div>
            </li>
          </ol>

        </div>
      </aside>
    </div>

    <el-dialog v-model="previewDialogVisible" title="输出预览" width="min(92vw, 960px)" align-center destroy-on-close
      class="cut-preview-dialog" append-to-body>
      <div class="cut-preview-stage">
        <img v-if="resultPreviewUrl" :src="resultPreviewUrl" alt="裁剪结果大图" class="cut-preview-img" />
      </div>
      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-mono text-xs text-base-content/55">
            <template v-if="outputWidth">
              {{ outputWidth }}×{{ outputHeight }}
              <template v-if="outputFileSize">
                · {{ formatBytes(outputFileSize) }}
              </template>
            </template>
          </span>
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="previewDialogVisible = false">
              关闭
            </button>
            <button type="button" class="btn btn-success btn-sm" :disabled="!outputWidth || loading" @click="save">
              保存图片
            </button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
definePageMeta({
  tool: true,
  title: '🎨图片去黑边',
  group: '媒体类',
});
</script>
<script>
import { ElMessageBox } from 'element-plus';

function supportsWebP() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      type === 'image/png' ? undefined : quality,
    );
  });
}

export default {
  name: 'cut-image',

  data() {
    return {
      loading: false,
      imgBaseUrl: '',
      isDragging: false,
      _dragDepth: 0,
      customTop: 0,
      customBottom: 0,
      calcData: {},
      outputWidth: 0,
      outputHeight: 0,
      outputFileSize: 0,
      outputMime: 'image/png',
      sourceWidth: 0,
      sourceHeight: 0,
      sourceFileSize: 0,
      sourceMime: '',
      exportFormat: 'jpeg',
      exportQuality: 0.92,
      webpSupported: true,
      translateX: 0,
      translateY: 0,
      moveElWidth: 200,
      moveElHeight: 150,
      previewImgWidth: 0,
      previewImgHeight: 0,
      isMove: false,
      _cutWorker: null,
      _cutReqId: 0,
      _cutAbsOffset: 0,
      _sourceImg: null,
      _outputCanvas: null,
      _outputBlob: null,
      resultPreviewUrl: '',
      previewDialogVisible: false,
      _encodeToken: 0,
      _skipCustomWatch: false,
      _qualityTimer: null,
      _customTimer: null,
    };
  },
  computed: {
    exportFormatOptions() {
      const opts = [
        { value: 'auto', label: '智能' },
        { value: 'webp', label: 'WebP' },
        { value: 'jpeg', label: 'JPEG' },
        { value: 'png', label: 'PNG 无损' },
      ];
      if (!this.webpSupported) {
        return opts.filter((o) => o.value !== 'webp');
      }
      return opts;
    },
    outputExtLabel() {
      const map = {
        'image/webp': 'WebP',
        'image/jpeg': 'JPEG',
        'image/png': 'PNG',
      };
      return map[this.outputMime] || 'IMG';
    },
    sourceExtLabel() {
      const mime = (this.sourceMime || '').toLowerCase();
      if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG';
      if (mime.includes('png')) return 'PNG';
      if (mime.includes('webp')) return 'WebP';
      if (mime.includes('gif')) return 'GIF';
      return mime ? mime.replace(/^image\//, '').toUpperCase() : 'IMG';
    },
    sizeSavedLabel() {
      if (!this.sourceFileSize || !this.outputFileSize) return '';
      const diff = this.sourceFileSize - this.outputFileSize;
      if (diff > 0) {
        const pct = ((diff / this.sourceFileSize) * 100).toFixed(1);
        return `体积约减少 ${this.formatBytes(diff)}（${pct}%）`;
      }
      if (diff < 0) {
        return `体积约增加 ${this.formatBytes(-diff)}（可改用 WebP/JPEG 或调低画质）`;
      }
      return '体积基本不变';
    },
  },
  watch: {
    exportFormat() {
      this.refreshEncodedOutput();
    },
    exportQuality() {
      clearTimeout(this._qualityTimer);
      this._qualityTimer = setTimeout(() => {
        this.refreshEncodedOutput();
      }, 120);
    },
    customTop() {
      this.scheduleCustomPreview();
    },
    customBottom() {
      this.scheduleCustomPreview();
    },
  },
  beforeUnmount() {
    this.terminateCutWorker();
    this.revokeOutputUrl();
    clearTimeout(this._qualityTimer);
    clearTimeout(this._customTimer);
  },
  mounted() {
    this.webpSupported = supportsWebP();
    if (!this.webpSupported && this.exportFormat === 'webp') {
      this.exportFormat = 'jpeg';
    }
  },
  methods: {
    formatBytes(bytes) {
      const n = Number(bytes);
      if (!Number.isFinite(n) || n < 0) return '—';
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    },
    revokeOutputUrl() {
      if (this.resultPreviewUrl) {
        URL.revokeObjectURL(this.resultPreviewUrl);
        this.resultPreviewUrl = '';
      }
    },
    scheduleCustomPreview() {
      if (this._skipCustomWatch) return;
      if (!this.calcData.top && this.calcData.top !== 0) return;
      clearTimeout(this._customTimer);
      this._customTimer = setTimeout(() => {
        this.handleCustom();
      }, 150);
    },
    resetCustom() {
      this._skipCustomWatch = true;
      this.customTop = 0;
      this.customBottom = 0;
      this.$nextTick(() => {
        this._skipCustomWatch = false;
        this.handleCustom();
      });
    },
    onDragEnter() {
      this._dragDepth += 1;
      this.isDragging = true;
    },
    onDragOver() {
      this.isDragging = true;
    },
    onDragLeave() {
      this._dragDepth = Math.max(0, this._dragDepth - 1);
      if (this._dragDepth === 0) this.isDragging = false;
    },
    onDrop(e) {
      this._dragDepth = 0;
      this.isDragging = false;
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|jpg)$/i.test(file.type) && !/\.(png|jpe?g)$/i.test(file.name)) {
        return;
      }
      this.loadFile(file);
    },
    openPreviewDialog() {
      if (!this.resultPreviewUrl) return;
      this.previewDialogVisible = true;
    },
    resolveExportMime() {
      const format = this.exportFormat;
      if (format === 'png') return 'image/png';
      if (format === 'jpeg') return 'image/jpeg';
      if (format === 'webp') {
        return this.webpSupported ? 'image/webp' : 'image/jpeg';
      }
      if (this.webpSupported) return 'image/webp';
      if (this.sourceMime.includes('jpeg') || this.sourceMime.includes('jpg')) {
        return 'image/jpeg';
      }
      return 'image/png';
    },
    mimeToExt(mime) {
      if (mime === 'image/webp') return 'webp';
      if (mime === 'image/jpeg') return 'jpg';
      return 'png';
    },
    async refreshEncodedOutput() {
      if (!this._outputCanvas) return;
      const token = ++this._encodeToken;
      const mime = this.resolveExportMime();
      const quality = this.exportQuality;

      let sourceCanvas = this._outputCanvas;
      if (mime === 'image/jpeg') {
        const c = document.createElement('canvas');
        c.width = sourceCanvas.width;
        c.height = sourceCanvas.height;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(sourceCanvas, 0, 0);
        sourceCanvas = c;
      }

      let blob = await canvasToBlob(sourceCanvas, mime, quality);

      if (!blob && mime === 'image/webp') {
        blob = await canvasToBlob(sourceCanvas, 'image/jpeg', quality);
      }
      if (!blob || token !== this._encodeToken) return;

      this.outputMime = blob.type || mime;
      this.outputFileSize = blob.size;
      this._outputBlob = blob;

      this.revokeOutputUrl();
      this.resultPreviewUrl = URL.createObjectURL(blob);
    },
    terminateCutWorker() {
      if (this._cutWorker) {
        this._cutWorker.terminate();
        this._cutWorker = null;
      }
    },
    getCutWorker() {
      if (this._cutWorker) return this._cutWorker;
      // 版本号避免浏览器缓存旧检测脚本
      const worker = new Worker('/worker.js?v=3');
      worker.onmessage = (event) => {
        const { top, bottom, requestId } = event.data;
        if (requestId !== this._cutReqId) return;
        const offset = this._cutAbsOffset || 0;
        this.calcData = {
          top: top + offset,
          bottom: bottom + offset,
        };
        this.setOutputImg();
      };
      worker.onerror = () => {
        this.loading = false;
      };
      this._cutWorker = worker;
      return worker;
    },
    loadSourceImage() {
      return new Promise((resolve, reject) => {
        if (
          this._sourceImg &&
          this._sourceImg.src === this.imgBaseUrl &&
          this._sourceImg.complete
        ) {
          resolve(this._sourceImg);
          return;
        }
        const img = new Image();
        img.onload = () => {
          this._sourceImg = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = this.imgBaseUrl;
      });
    },
    afterCropGesture() {
      if (!this.imgBaseUrl || !this.previewImgHeight) return;
      this.handleCut();
    },
    handleLineDown(e, type) {
      this.isMove = true;

      const isN =
        type.indexOf('n') > -1 ||
        type.indexOf('ne') > -1 ||
        type.indexOf('nw') > -1;
      const isS =
        type.indexOf('s') > -1 ||
        type.indexOf('se') > -1 ||
        type.indexOf('sw') > -1;
      const isW =
        type.indexOf('w') > -1 ||
        type.indexOf('nw') > -1 ||
        type.indexOf('sw') > -1;
      const isE =
        type.indexOf('e') > -1 ||
        type.indexOf('ne') > -1 ||
        type.indexOf('se') > -1;

      const vm = this;
      let downX = 'clientX' in e ? e.clientX : e.touches[0].clientX,
        downY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

      window.addEventListener('mousemove', handleLineMove);
      window.addEventListener('mouseup', handleLineUp);
      window.addEventListener('touchmove', handleLineMove, { passive: false });
      window.addEventListener('touchend', handleLineUp);
      const pre_moveElHeight = vm.moveElHeight;
      const pre_moveElWidth = vm.moveElWidth;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function handleLineMove(e) {
        if (e.cancelable) e.preventDefault();
        let nowX = 0;
        let nowY = 0;
        if (e) {
          nowX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
          nowY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        }
        let deltaX = nowX - downX;
        let deltaY = nowY - downY;

        if (isE) {
          let _res = Math.max(pre_moveElWidth + deltaX, 1);
          _res = Math.min(_res, vm.previewImgWidth - vm.translateX);
          vm.moveElWidth = _res;
        }
        if (isS) {
          let _res = Math.max(pre_moveElHeight + deltaY, 1);
          _res = Math.min(_res, vm.previewImgHeight - vm.translateY);
          vm.moveElHeight = _res;
        }
        if (isW) {
          if (pre_translateX + deltaX >= 0 && deltaX < pre_moveElWidth) {
            vm.translateX = Math.max(pre_translateX + deltaX, 0);
            if (pre_moveElWidth - deltaX < 1) {
              vm.moveElWidth = 1;
            } else {
              vm.moveElWidth = Math.max(pre_moveElWidth - deltaX, 1);
            }
          }
        }
        if (isN) {
          if (pre_translateY + deltaY >= 0 && deltaY < pre_moveElHeight) {
            vm.translateY = Math.max(pre_translateY + deltaY, 0);
            if (pre_moveElHeight - deltaY < 1) {
              vm.moveElHeight = 1;
            } else {
              vm.moveElHeight = Math.max(pre_moveElHeight - deltaY, 1);
            }
          }
        }
      }
      function handleLineUp() {
        vm.isMove = false;
        window.removeEventListener('mousemove', handleLineMove);
        window.removeEventListener('mouseup', handleLineUp);
        window.removeEventListener('touchmove', handleLineMove);
        window.removeEventListener('touchend', handleLineUp);
        vm.afterCropGesture();
      }
    },
    handleMoveEl(e) {
      const vm = this;
      vm.isMove = true;
      window.addEventListener('mousemove', moveCrop);
      window.addEventListener('mouseup', leaveCrop);
      window.addEventListener('touchmove', moveCrop, { passive: false });
      window.addEventListener('touchend', leaveCrop);
      let downX = 'clientX' in e ? e.clientX : e.touches[0].clientX,
        downY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function moveCrop(e) {
        let nowX = 0;
        let nowY = 0;
        if (e) {
          if (e.cancelable) e.preventDefault();
          nowX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
          nowY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        }

        let newX = Math.max(pre_translateX + nowX - downX, 0);
        let newY = Math.max(pre_translateY + nowY - downY, 0);

        if (newX > vm.previewImgWidth - vm.moveElWidth) {
          newX = vm.previewImgWidth - vm.moveElWidth;
        }
        if (newY > vm.previewImgHeight - vm.moveElHeight) {
          newY = vm.previewImgHeight - vm.moveElHeight;
        }
        vm.translateX = newX;
        vm.translateY = newY;
      }
      function leaveCrop() {
        vm.isMove = false;
        window.removeEventListener('mousemove', moveCrop);
        window.removeEventListener('mouseup', leaveCrop);
        window.removeEventListener('touchmove', moveCrop);
        window.removeEventListener('touchend', leaveCrop);
        vm.afterCropGesture();
      }
    },

    fileChange(e) {
      const [file] = e.target.files || [];
      if (!file) return;
      this.loadFile(file);
      e.target.value = '';
    },
    loadFile(file) {
      this.resetState(false);
      this.sourceFileSize = file.size || 0;
      this.sourceMime = file.type || '';
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const vm = this;

      reader.onload = () => {
        this.imgBaseUrl = reader.result;

        this.$nextTick(() => {
          const previewImg = document.querySelector('.preview-img');
          if (!previewImg) return;
          const applySize = () => {
            const rect = previewImg.getBoundingClientRect();
            const width = Math.max(1, Math.round(rect.width) || previewImg.width);
            const height = Math.max(
              1,
              Math.round(rect.height) || previewImg.height,
            );
            vm.previewImgWidth = vm.moveElWidth = width;
            vm.previewImgHeight = vm.moveElHeight = height;
            vm.translateX = 0;
            vm.translateY = 0;
            vm.handleCut();
          };
          previewImg.onload = () => {
            requestAnimationFrame(applySize);
          };
          if (previewImg.complete && previewImg.naturalWidth) {
            requestAnimationFrame(applySize);
          }
        });
      };
    },
    async save() {
      if (!this._outputBlob && !this.resultPreviewUrl) {
        return;
      }
      if (this._outputCanvas) {
        await this.refreshEncodedOutput();
      }
      if (!this._outputBlob) return;

      const originText = `${this.sourceWidth}×${this.sourceHeight}，${this.formatBytes(this.sourceFileSize)}`;
      const saveText = `${this.outputWidth}×${this.outputHeight}，${this.formatBytes(this.outputFileSize)}（${this.outputExtLabel}）`;
      try {
        await ElMessageBox.confirm(
          `<div style="line-height:1.7">
            <div><b>原图</b>：${originText}</div>
            <div><b>即将保存</b>：${saveText}</div>
            ${this.sizeSavedLabel ? `<div style="margin-top:8px;opacity:.85">${this.sizeSavedLabel}</div>` : ''}
          </div>`,
          '确认保存',
          {
            confirmButtonText: '下载',
            cancelButtonText: '取消',
            type: 'info',
            dangerouslyUseHTMLString: true,
          },
        );
      } catch {
        return;
      }
      const url = URL.createObjectURL(this._outputBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image.${this.mimeToExt(this.outputMime)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    async setOutputImg() {
      if (
        this.calcData.top == null ||
        this.calcData.bottom == null ||
        !this.imgBaseUrl
      ) {
        this.loading = false;
        return;
      }
      try {
        const img = await this.loadSourceImage();
        this.sourceWidth = img.naturalWidth || img.width;
        this.sourceHeight = img.naturalHeight || img.height;
        const { width } = img;
        let top = this.calcData.top + this.customTop;
        let bottom = this.calcData.bottom - this.customBottom;

        top = Math.max(0, Math.min(img.height - 1, top));
        bottom = Math.max(top + 1, Math.min(img.height, bottom));

        const cropH = bottom - top;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = cropH;
        this.outputWidth = width;
        this.outputHeight = cropH;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, top, width, cropH, 0, 0, width, cropH);

        this._outputCanvas = canvas;
        await this.refreshEncodedOutput();
      } finally {
        this.loading = false;
      }
    },
    async handleCut() {
      if (!this.imgBaseUrl || !this.previewImgHeight) {
        return;
      }
      this.loading = true;
      this._cutReqId += 1;
      const requestId = this._cutReqId;

      try {
        const img = await this.loadSourceImage();
        const { width, height } = img;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        let start = Math.floor(
          (this.translateY * height) / this.previewImgHeight,
        );
        let end = Math.ceil(
          ((this.translateY + this.moveElHeight) * height) /
          this.previewImgHeight,
        );
        start = Math.max(0, Math.min(height - 1, start));
        end = Math.max(start + 1, Math.min(height, end));

        const imageData = ctx.getImageData(0, start, width, end - start);
        const worker = this.getCutWorker();

        worker.postMessage(
          {
            buffer: imageData.data.buffer,
            width,
            height: end - start,
            start: 0,
            end: end - start,
            requestId,
          },
          [imageData.data.buffer],
        );

        this._cutAbsOffset = start;
      } catch (e) {
        console.error(e);
        this.loading = false;
      }
    },
    handleCustom() {
      if (this.calcData.top == null || this.calcData.bottom == null) return;
      this.loading = true;
      this.setOutputImg();
    },
    resetState(clearImage = true) {
      this._skipCustomWatch = true;
      this.customTop = 0;
      this.customBottom = 0;
      this.calcData = {};
      this.outputWidth = 0;
      this.outputHeight = 0;
      this.outputFileSize = 0;
      this.outputMime = 'image/png';
      this.sourceWidth = 0;
      this.sourceHeight = 0;
      this.sourceFileSize = 0;
      this.sourceMime = '';
      this.translateX = 0;
      this.translateY = 0;
      this._cutReqId += 1;
      this._outputCanvas = null;
      this._outputBlob = null;
      this.revokeOutputUrl();
      this._sourceImg = null;
      this.previewDialogVisible = false;
      if (clearImage) {
        this.imgBaseUrl = '';
      }
      this.$nextTick(() => {
        this._skipCustomWatch = false;
      });
    },
    reset() {
      this.resetState(true);
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
  },
};
</script>
<style scoped>
.bg-container {
  position: relative;
  touch-action: none;
  box-sizing: border-box;
}

.bg-container.is-empty {
  width: 100%;
  aspect-ratio: 1;
  min-height: 240px;
  max-height: 420px;
}

.bg-container.has-image {
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 8px;
  overflow: visible;
}

.px-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  user-select: none;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAABFJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC');
  opacity: 0.55;
}

.mask-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background-color: rgba(0, 0, 0, 0.35);
  pointer-events: none;
  user-select: none;
}

.preview-container {
  position: relative;
  z-index: 1;
  max-width: 100%;
  line-height: 0;
  touch-action: none;
}

.preview-container.has-img {
  display: inline-block;
  max-width: 100%;
}

.preview-img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: min(58vh, 640px);
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}

.cut-wrapper {
  position: absolute;
  inset: 0;
  user-select: none;
}

.cropper-crop-box {
  position: absolute;
  top: 0;
  left: 0;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  outline: 1px solid rgba(59, 130, 246, 0.9);
}

.cropper-face {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.12);
  cursor: move;
}

.crop-info {
  position: absolute;
  left: 0;
  bottom: -24px;
  z-index: 2;
  min-width: 72px;
  padding: 0 6px;
  border-radius: 4px;
  background-color: rgba(15, 23, 42, 0.85);
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
  text-align: center;
}

.crop-line {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

.line-n {
  top: -3px;
  left: 0;
  height: 5px;
  cursor: n-resize;
}

.line-w {
  top: 0;
  left: -3px;
  width: 5px;
  cursor: w-resize;
}

.line-s {
  bottom: -3px;
  left: 0;
  height: 5px;
  cursor: s-resize;
}

.line-e {
  top: 0;
  right: -3px;
  width: 5px;
  cursor: e-resize;
}

.crop-point {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 100%;
  background-color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.point1 {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
}

.point2 {
  top: -5px;
  left: 50%;
  margin-left: -5px;
  cursor: n-resize;
}

.point3 {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
}

.point4 {
  top: 50%;
  left: -5px;
  margin-top: -5px;
  cursor: w-resize;
}

.point5 {
  top: 50%;
  right: -5px;
  margin-top: -5px;
  cursor: e-resize;
}

.point6 {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
}

.point7 {
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
  cursor: s-resize;
}

.point8 {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}

.result-img-container :deep(img),
.result-img-container img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.pipeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pipeline-step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
}

.pipeline-rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pipeline-dot {
  z-index: 1;
  display: flex;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1.5px solid color-mix(in oklab, var(--color-base-content) 25%, transparent);
  background: var(--color-base-100);
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.pipeline-line {
  width: 2px;
  flex: 1;
  min-height: 12px;
  margin: 4px 0 2px;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-base-content) 14%, transparent);
}

.pipeline-body {
  min-width: 0;
  padding-bottom: 16px;
}

.pipeline-step.is-last .pipeline-body {
  padding-bottom: 0;
}

.pipeline-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.pipeline-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-base-content);
}

.pipeline-hint {
  font-size: 11px;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.pipeline-step.is-active .pipeline-dot {
  border-color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}

.pipeline-step.is-done .pipeline-dot {
  border-color: var(--color-success);
  background: color-mix(in oklab, var(--color-success) 18%, transparent);
  color: var(--color-success);
}

.pipeline-step.is-done .pipeline-line {
  background: color-mix(in oklab, var(--color-success) 45%, transparent);
}

.pipeline-step.is-locked .pipeline-body {
  opacity: 0.55;
}

.pipeline-step.is-locked .pipeline-title {
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
}

.cut-preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: min(60vh, 520px);
  max-height: min(78vh, 820px);
  padding: 16px;
  overflow: auto;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.cut-preview-img {
  display: block;
  max-width: 100%;
  max-height: min(72vh, 760px);
  width: auto;
  height: auto;
  object-fit: contain;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}

@media screen and (max-width: 640px) {
  .preview-img {
    max-height: min(48vh, 420px);
  }

  .crop-point {
    width: 18px;
    height: 18px;
  }

  .point1 {
    top: -9px;
    left: -9px;
  }

  .point2,
  .point4,
  .point5,
  .point7 {
    display: none;
  }

  .point3 {
    top: -9px;
    right: -9px;
  }

  .point6 {
    bottom: -9px;
    left: -9px;
  }

  .point8 {
    bottom: -9px;
    right: -9px;
  }
}

@media screen and (min-width: 1024px) {
  .preview-img {
    max-height: min(70vh, 720px);
  }
}
</style>

<style>
/* append-to-body 弹窗样式 */
.cut-preview-dialog .el-dialog__body {
  padding-top: 8px;
  padding-bottom: 12px;
}

.cut-preview-dialog .cut-preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: min(60vh, 520px);
  max-height: min(78vh, 820px);
  padding: 16px;
  overflow: auto;
  background: #ffffff !important;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.cut-preview-dialog .cut-preview-img {
  display: block;
  max-width: 100%;
  max-height: min(72vh, 760px);
  width: auto;
  height: auto;
  object-fit: contain;
}
</style>
