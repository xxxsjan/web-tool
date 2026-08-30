<template>
  <section
    class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm">
    <div class="border-b border-base-300/50 px-4 py-3 sm:px-5">
      <h2 class="text-sm font-semibold text-base-content sm:text-base">AVIF 转 PNG</h2>
      <p class="mt-0.5 text-[11px] text-base-content/45 sm:text-xs">
        浏览器端解码，单文件，建议不超过 10MB
      </p>
    </div>

    <div class="space-y-4 p-4 sm:p-5">
      <label
        class="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-base-300/80 bg-base-200/30 px-4 py-10 transition-colors hover:border-primary/50 hover:bg-base-200/50"
        @dragover.prevent
        @drop.prevent="onDrop">
        <input
          type="file"
          accept=".avif,image/avif"
          class="hidden"
          @change="handleFileUpload" />
        <p class="text-sm font-medium text-base-content">点击选择 AVIF，或拖放到此处</p>
        <p class="mt-1 text-xs text-base-content/45">仅支持 .avif</p>
      </label>

      <div v-if="isLoading" class="rounded-lg bg-base-200/60 px-3 py-2 text-center text-sm text-base-content/70">
        转换中…
      </div>

      <div
        v-if="errorMessage"
        class="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
        {{ errorMessage }}
      </div>

      <div v-show="showPreview" class="space-y-3">
        <p class="text-sm font-medium text-base-content">预览</p>
        <div
          class="overflow-hidden rounded-xl border border-base-300/60 bg-base-200/40 p-3">
          <canvas ref="previewCanvas" class="mx-auto max-h-64 max-w-full rounded-lg" />
        </div>
        <a
          v-show="downloadUrl"
          :href="downloadUrl"
          :download="downloadFilename"
          class="btn btn-primary btn-sm">
          下载 PNG
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
const previewCanvas = ref(null);
const downloadUrl = ref('');
const downloadFilename = ref('');
const showPreview = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

const convertFile = async file => {
  if (!file) return;

  resetState();
  isLoading.value = true;

  try {
    const avifData = await file.arrayBuffer();
    const blob = new Blob([avifData], { type: 'image/avif' });
    const imgBitmap = await createImageBitmap(blob);

    const canvas = previewCanvas.value;
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgBitmap, 0, 0);

    const pngDataURL = canvas.toDataURL('image/png');
    downloadUrl.value = pngDataURL;
    downloadFilename.value = file.name.replace(/\.avif$/i, '.png');
    showPreview.value = true;

    imgBitmap.close();
  } catch (error) {
    errorMessage.value = `转换失败：${error.message}`;
  } finally {
    isLoading.value = false;
  }
};

const handleFileUpload = async event => {
  await convertFile(event.target.files[0]);
};

const onDrop = async event => {
  const file = event.dataTransfer?.files?.[0];
  if (file) await convertFile(file);
};

const resetState = () => {
  downloadUrl.value = '';
  showPreview.value = false;
  errorMessage.value = '';
};
</script>
