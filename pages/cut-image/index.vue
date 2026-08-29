<template>
  <div class="cut-page box-border mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
    <header class="mb-6 text-center sm:mb-8">
      <h1 class="mb-2 text-xl font-bold text-base-content sm:text-3xl">
        图片去黑边
      </h1>
      <p
        class="mx-auto max-w-md text-xs leading-relaxed text-base-content/60 sm:text-base"
      >
        框选区域后自动检测并裁掉上下黑边，支持像素级微调后导出
      </p>
    </header>

    <!-- 空状态：整块水平居中 -->
    <div v-if="!imgBaseUrl" class="mx-auto w-full max-w-md">
      <div
        class="bg-container is-empty relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-base-300/60 shadow-lg"
        v-loading="loading"
      >
        <div class="px-bg"></div>
        <label
          class="upload-zone absolute inset-3 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-content/25 px-3 text-center transition-colors hover:border-primary hover:bg-base-100/40 sm:inset-4"
        >
          <span
            class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </span>
          <span class="text-base font-medium text-base-content"
            >点击选择图片</span
          >
          <span class="text-xs text-base-content/50">支持 PNG / JPG / JPEG</span>
          <input
            type="file"
            class="sr-only"
            accept=".png,.jpg,.jpeg"
            @change="fileChange"
          />
        </label>
      </div>
    </div>

    <!-- 有图：移动端上下，PC 左右 -->
    <div
      v-else
      class="flex w-full flex-col gap-5 lg:flex-row lg:items-start lg:gap-8"
    >
      <div class="flex min-w-0 w-full flex-1 flex-col items-center">
        <div
          class="bg-container has-image relative flex w-full items-center justify-center rounded-2xl border border-base-300/60 shadow-lg"
          v-loading="loading"
        >
          <div class="px-bg"></div>
          <div class="mask-bg"></div>
          <div class="preview-container has-img">
            <img :src="imgBaseUrl" alt="" class="preview-img" />
            <div class="cut-wrapper">
              <div
                class="cropper-crop-box"
                :style="{
                  width: moveElWidth + 'px',
                  height: moveElHeight + 'px',
                  transform: `translate3d(${translateX}px, ${translateY}px, 0px)`,
                }"
              >
                <span
                  class="cropper-face"
                  @mousedown="handleMoveEl"
                  @touchstart="handleMoveEl"
                ></span>
                <span class="crop-info">
                  {{ parseInt(moveElWidth) }} × {{ parseInt(moveElHeight) }}
                </span>
                <span>
                  <span
                    class="crop-line line-n"
                    @mousedown="handleLineDown($event, 'n')"
                    @touchstart="handleLineDown($event, 'n')"
                  ></span>
                  <span
                    class="crop-line line-w"
                    @mousedown="handleLineDown($event, 'w')"
                    @touchstart="handleLineDown($event, 'w')"
                  ></span>
                  <span
                    class="crop-line line-s"
                    @mousedown="handleLineDown($event, 's')"
                    @touchstart="handleLineDown($event, 's')"
                  ></span>
                  <span
                    class="crop-line line-e"
                    @mousedown="handleLineDown($event, 'e')"
                    @touchstart="handleLineDown($event, 'e')"
                  ></span>
                  <span
                    class="crop-point point1 nw"
                    @mousedown="handleLineDown($event, 'nw')"
                    @touchstart="handleLineDown($event, 'nw')"
                  ></span>
                  <span
                    class="crop-point point2 n"
                    @mousedown="handleLineDown($event, 'n')"
                    @touchstart="handleLineDown($event, 'n')"
                  ></span>
                  <span
                    class="crop-point point3 ne"
                    @mousedown="handleLineDown($event, 'ne')"
                    @touchstart="handleLineDown($event, 'ne')"
                  ></span>
                  <span
                    class="crop-point point4 w"
                    @mousedown="handleLineDown($event, 'w')"
                    @touchstart="handleLineDown($event, 'w')"
                  ></span>
                  <span
                    class="crop-point point5 e"
                    @mousedown="handleLineDown($event, 'e')"
                    @touchstart="handleLineDown($event, 'e')"
                  ></span>
                  <span
                    class="crop-point point6 sw"
                    @mousedown="handleLineDown($event, 'sw')"
                    @touchstart="handleLineDown($event, 'sw')"
                  ></span>
                  <span
                    class="crop-point point7 s"
                    @mousedown="handleLineDown($event, 's')"
                    @touchstart="handleLineDown($event, 's')"
                  ></span>
                  <span
                    class="crop-point point8 se"
                    @mousedown="handleLineDown($event, 'se')"
                    @touchstart="handleLineDown($event, 'se')"
                  ></span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p class="mt-2 text-center text-[11px] text-base-content/50 sm:mt-3 sm:text-xs">
          拖动选区移动，拖角点调整范围
        </p>
      </div>

      <aside class="w-full shrink-0 lg:w-80 lg:sticky lg:top-4">
        <div
          class="flex flex-col gap-4 rounded-2xl border border-base-300/60 bg-base-100/90 p-4 shadow-lg backdrop-blur-sm sm:p-5"
        >
          <div class="flex gap-2">
            <button
              class="btn btn-primary btn-sm flex-1 sm:btn-md"
              :disabled="loading"
              @click="handleCut"
            >
              {{ loading ? '处理中…' : '去黑边' }}
            </button>
            <button
              class="btn btn-ghost btn-sm shrink-0 border border-base-300 sm:btn-md"
              @click="reset"
            >
              重选
            </button>
          </div>

          <section class="space-y-2">
            <div class="flex items-center justify-between gap-2 text-sm">
              <span class="shrink-0 font-medium text-base-content"
                >输出预览</span
              >
              <span
                v-if="outputWidth"
                class="badge badge-ghost badge-sm font-mono"
              >
                {{ outputWidth }}×{{ outputHeight }}
              </span>
            </div>
            <div
              class="result-img-container flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-base-300 bg-base-200/50 p-2 sm:h-56 sm:p-3"
            ></div>

            <div
              v-if="sourceWidth && outputWidth"
              class="space-y-1.5 rounded-xl bg-base-200/60 px-3 py-2 text-[11px] sm:text-xs"
            >
              <div
                class="flex flex-col gap-0.5 text-base-content/70 sm:flex-row sm:justify-between sm:gap-2"
              >
                <span class="shrink-0">原图</span>
                <span class="break-all font-mono text-base-content sm:text-right">
                  {{ sourceWidth }}×{{ sourceHeight }}
                  <span class="text-base-content/50">·</span>
                  {{ formatBytes(sourceFileSize) }}
                </span>
              </div>
              <div
                class="flex flex-col gap-0.5 text-base-content/70 sm:flex-row sm:justify-between sm:gap-2"
              >
                <span class="shrink-0">即将保存</span>
                <span class="break-all font-mono text-base-content sm:text-right">
                  {{ outputWidth }}×{{ outputHeight }}
                  <span class="text-base-content/50">·</span>
                  {{ formatBytes(outputFileSize) }}
                  <span class="text-base-content/50"
                    >({{ outputExtLabel }})</span
                  >
                </span>
              </div>
              <div
                v-if="sizeSavedLabel"
                class="border-t border-base-300/40 pt-1 leading-snug text-success"
              >
                {{ sizeSavedLabel }}
              </div>
            </div>

            <div v-if="outputWidth" class="space-y-2">
              <div class="text-sm font-medium text-base-content">导出压缩</div>
              <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <label
                  v-for="opt in exportFormatOptions"
                  :key="opt.value"
                  class="cursor-pointer"
                >
                  <input
                    v-model="exportFormat"
                    type="radio"
                    class="peer hidden"
                    name="export-format"
                    :value="opt.value"
                  />
                  <span
                    class="btn btn-ghost btn-xs w-full border border-base-300 peer-checked:btn-primary"
                  >
                    {{ opt.label }}
                  </span>
                </label>
              </div>
              <div v-if="exportFormat !== 'png'" class="space-y-1">
                <div class="flex justify-between text-xs text-base-content/60">
                  <span>画质</span>
                  <span class="font-mono"
                    >{{ Math.round(exportQuality * 100) }}%</span
                  >
                </div>
                <input
                  v-model.number="exportQuality"
                  type="range"
                  min="0.7"
                  max="0.98"
                  step="0.01"
                  class="range range-primary range-xs w-full"
                />
                <p class="text-[11px] leading-snug text-base-content/45">
                  建议 90%–95%：观感接近无损，体积通常远小于 PNG
                </p>
              </div>
            </div>
          </section>

          <section class="space-y-3 border-t border-base-300/50 pt-1">
            <div class="text-sm font-medium text-base-content">
              边缘微调
              <span class="font-normal text-base-content/50">（±10px）</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1 text-xs text-base-content/70">
                <span>上</span>
                <el-input-number
                  v-model="customTop"
                  class="!w-full"
                  :min="-10"
                  :max="10"
                  size="small"
                  controls-position="right"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs text-base-content/70">
                <span>下</span>
                <el-input-number
                  v-model="customBottom"
                  class="!w-full"
                  :min="-10"
                  :max="10"
                  size="small"
                  controls-position="right"
                />
              </label>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button class="btn btn-outline btn-sm" @click="handleCustom">
                应用修正
              </button>
              <button
                class="btn btn-success btn-sm"
                :disabled="!outputWidth"
                @click="save"
              >
                保存图片
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>
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
      exportFormat: 'auto', // auto | webp | jpeg | png
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
      _outputObjectUrl: '',
      _encodeToken: 0,
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
  },
  beforeUnmount() {
    this.terminateCutWorker();
    this.revokeOutputUrl();
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
      if (this._outputObjectUrl) {
        URL.revokeObjectURL(this._outputObjectUrl);
        this._outputObjectUrl = '';
      }
    },
    resolveExportMime() {
      const format = this.exportFormat;
      if (format === 'png') return 'image/png';
      if (format === 'jpeg') return 'image/jpeg';
      if (format === 'webp') {
        return this.webpSupported ? 'image/webp' : 'image/jpeg';
      }
      // auto：优先 WebP（同等观感体积更小），否则跟原图走
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
      // JPEG 无透明通道：导出前铺白底
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

      // WebP 不可用或失败时回退
      if (!blob && mime === 'image/webp') {
        blob = await canvasToBlob(sourceCanvas, 'image/jpeg', quality);
      }
      if (!blob || token !== this._encodeToken) return;

      this.outputMime = blob.type || mime;
      this.outputFileSize = blob.size;
      this._outputBlob = blob;

      this.revokeOutputUrl();
      const url = URL.createObjectURL(blob);
      this._outputObjectUrl = url;

      const resultImg = new Image();
      resultImg.src = url;
      resultImg.id = 'base64Img';
      resultImg.alt = '裁剪结果';

      const container = document.querySelector('.result-img-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(resultImg);
      }
    },
    terminateCutWorker() {
      if (this._cutWorker) {
        this._cutWorker.terminate();
        this._cutWorker = null;
      }
    },
    getCutWorker() {
      if (this._cutWorker) return this._cutWorker;
      const worker = new Worker('/worker.js');
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
    handleLineDown(e, type) {
      this.isMove = true;

      console.log('type: ', type);
      // 上北下南 左西右东
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
      window.addEventListener('touchmove', handleLineMove);
      window.addEventListener('touchend', handleLineUp);
      const pre_moveElHeight = vm.moveElHeight;
      const pre_moveElWidth = vm.moveElWidth;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function handleLineMove(e) {
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
          _res = Math.min(_res, vm.previewImgWidth);
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
      function handleLineUp(e) {
        vm.isMove = false;
        console.log(vm.moveElWidth, vm.moveElHeight);
        console.log(vm.translateX, vm.translateY);
        window.removeEventListener('mousemove', handleLineMove);
        window.removeEventListener('mouseup', handleLineUp);
        window.removeEventListener('touchmove', handleLineMove);
        window.removeEventListener('touchend', handleLineUp);
      }
    },
    handleMoveEl(e) {
      const vm = this;
      vm.isMove = true;
      console.log(vm.translateX, vm.translateY);
      window.addEventListener('mousemove', moveCrop);
      window.addEventListener('mouseup', leaveCrop);
      window.addEventListener('touchmove', moveCrop);
      window.addEventListener('touchend', leaveCrop);
      const moveEl = document.querySelector('.cropper-crop-box');
      let downX = 'clientX' in e ? e.clientX : e.touches[0].clientX,
        downY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function moveCrop(e) {
        let nowX = 0;
        let nowY = 0;
        if (e) {
          e.preventDefault();
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
      function leaveCrop(e) {
        vm.isMove = false;
        console.log(vm.translateX, vm.translateY);
        window.removeEventListener('mousemove', moveCrop);
        window.removeEventListener('mouseup', leaveCrop);
        window.removeEventListener('touchmove', moveCrop);
        window.removeEventListener('touchend', leaveCrop);
      }
    },

    fileChange(e) {
      this.reset();
      const [file] = e.target.files;
      if (!file) return;
      this.sourceFileSize = file.size || 0;
      this.sourceMime = file.type || '';
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const vm = this;

      reader.onload = () => {
        var base64 = reader.result;
        this.imgBaseUrl = base64;

        this.$nextTick(() => {
          const previewImg = document.querySelector('.preview-img');
          if (!previewImg) return;
          const applySize = () => {
            // 用实际渲染尺寸，避免响应式 max-height 后选区错位
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
      if (!this._outputBlob && !document.getElementById('base64Img')?.src) {
        return;
      }
      // 确保最新编码
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
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
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

        // 仅分析选区内的行
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

        // 把选区行拼成「虚拟高度」传给 worker：用 start/end 相对坐标系
        // worker 按绝对行号处理更直观，这里传整图选区 buffer + 绝对起止
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
    removeBase64Img() {
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
      this.imgBaseUrl = '';
      this._sourceImg = null;
    },
    handleCustom() {
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
      this.loading = true;
      this.setOutputImg();
    },
    reset() {
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
      this.removeBase64Img();
      const container = document.querySelector('.result-img-container');
      if (container) container.innerHTML = '';
    },
  },
};
</script>
<style scoped>
.cut-page {
  display: block;
  width: 100%;
  max-width: 72rem;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

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
