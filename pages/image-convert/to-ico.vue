<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div class="form-control w-full">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">选择图片</span>
        </label>
        <input
          type="file"
          class="file-input file-input-bordered file-input-sm w-full"
          accept="image/*"
          @change="fileChange"
        />
      </div>

      <div class="form-control w-full sm:w-36">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">输出尺寸</span>
        </label>
        <select
          v-model="outputSize"
          class="select select-bordered select-sm w-full"
        >
          <option
            v-for="size in [16, 32, 48, 64, 128, 256]"
            :key="size"
            :value="size"
          >
            {{ size }}×{{ size }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-sm w-full sm:w-auto"
        :disabled="!file || isLoading"
        @click="toDo"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        {{ isLoading ? '生成中…' : '生成 ICO' }}
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div v-if="resultArr.length" class="space-y-3 tool-panel-foot pt-4">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-medium text-base-content">生成结果</h3>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          @click="clearResults"
        >
          清空
        </button>
      </div>
      <ul class="space-y-2">
        <li
          v-for="(item, index) in resultArr"
          :key="item.id"
          class="flex items-center gap-3 rounded-xl border border-app bg-base-200/40 px-3 py-2.5"
        >
          <img
            :src="item.previewUrl"
            alt=""
            class="h-12 w-12 shrink-0 rounded-lg border border-app-strong bg-base-100 object-contain p-1"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-base-content">
              {{ item.iconName }}.ico
            </p>
            <p class="text-xs text-base-content/50">
              {{ item.size }}×{{ item.size }} · {{ formatBytes(item.bytes) }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm shrink-0"
            @click="downloadIco(item)"
          >
            下载
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square shrink-0"
            aria-label="移除"
            @click="removeResult(index)"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const outputSize = ref(32);
const file = ref(null);
const resultArr = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
let idSeq = 0;

function formatBytes(bytes) {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fileChange(e) {
  file.value = e.target.files?.[0] || null;
  errorMessage.value = '';
}

function clearResults() {
  for (const item of resultArr.value) {
    URL.revokeObjectURL(item.previewUrl);
    URL.revokeObjectURL(item.icoUrl);
  }
  resultArr.value = [];
}

function removeResult(index) {
  const [item] = resultArr.value.splice(index, 1);
  if (item) {
    URL.revokeObjectURL(item.previewUrl);
    URL.revokeObjectURL(item.icoUrl);
  }
}

async function toDo() {
  const _file = file.value;
  if (!_file) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const dataUrl = await readFileAsDataURL(_file);
    const size = outputSize.value;
    const { canvas, previewUrl } = await drawToCanvas(dataUrl, size);
    const pngBlob = await canvasToBlob(canvas, 'image/png');
    const pngBuffer = await pngBlob.arrayBuffer();
    const icoBuffer = buildIcoFromPng(new Uint8Array(pngBuffer), size);
    const icoBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
    const icoUrl = URL.createObjectURL(icoBlob);
    const base = _file.name.replace(/\.[^.]+$/, '') || 'icon';

    resultArr.value.push({
      id: ++idSeq,
      iconName: `${base}_icon_${size}`,
      size,
      bytes: icoBlob.size,
      previewUrl,
      icoUrl,
    });
  } catch (err) {
    errorMessage.value = `生成失败：${err?.message || err}`;
  } finally {
    isLoading.value = false;
  }
}

function readFileAsDataURL(f) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('读取文件失败'));
    fr.readAsDataURL(f);
  });
}

function drawToCanvas(dataUrl, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法创建画布');

        const [dx, dy, dw, dh] = aspectFit(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          size,
          size,
        );
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, dx, dy, dw, dh);

        resolve({
          canvas,
          previewUrl: canvas.toDataURL('image/png'),
        });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('图片加载失败，请确认格式受支持'));
    img.src = dataUrl;
  });
}

function aspectFit(imageWidth, imageHeight, canvasWidth, canvasHeight) {
  if (!imageWidth || !imageHeight) {
    return [0, 0, canvasWidth, canvasHeight];
  }
  const imageRate = imageWidth / imageHeight;
  const canvasRate = canvasWidth / canvasHeight;
  let dx;
  let dy;
  let dw;
  let dh;
  if (imageRate >= canvasRate) {
    dw = canvasWidth;
    dh = canvasWidth / imageRate;
  } else {
    dh = canvasHeight;
    dw = canvasHeight * imageRate;
  }
  dx = (canvasWidth - dw) / 2;
  dy = (canvasHeight - dh) / 2;
  return [dx, dy, dw, dh];
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('导出 PNG 失败'));
      else resolve(blob);
    }, type);
  });
}

/**
 * 将 PNG 封装为单尺寸 ICO（Vista+ 支持的 PNG-in-ICO）
 * @param {Uint8Array} pngBytes
 * @param {number} size 边长，256 时目录项宽高写 0
 */
function buildIcoFromPng(pngBytes, size) {
  const headerSize = 6;
  const entrySize = 16;
  const imageOffset = headerSize + entrySize;
  const buffer = new ArrayBuffer(imageOffset + pngBytes.length);
  const view = new DataView(buffer);
  const out = new Uint8Array(buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type = icon
  view.setUint16(4, 1, true); // count

  // ICONDIRENTRY
  const dim = size >= 256 ? 0 : size;
  view.setUint8(6, dim); // width
  view.setUint8(7, dim); // height
  view.setUint8(8, 0); // color count
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // planes
  view.setUint16(12, 32, true); // bit count
  view.setUint32(14, pngBytes.length, true); // bytes in resource
  view.setUint32(18, imageOffset, true); // image offset

  out.set(pngBytes, imageOffset);
  return out;
}

function downloadIco(item) {
  const a = document.createElement('a');
  a.download = `${item.iconName}.ico`;
  a.href = item.icoUrl;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

onUnmounted(() => {
  clearResults();
});
</script>
