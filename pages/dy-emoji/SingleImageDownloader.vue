<template>
  <div class="single-image-downloader">
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="imageUrl"
        class="input input-bordered flex-1"
        placeholder="单独输入图片地址进行下载"
        @keyup.enter="handleDownload"
      />
      <button
        class="btn btn-info"
        @click="handleDownload"
        :disabled="!imageUrl.trim() || downloading"
      >
        {{ downloading ? '下载中...' : '单图下载' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { saveAs } from 'file-saver';
import { convertWebpToJpgAndDownload } from './utils';

// 图片地址输入
const imageUrl = ref('');
// 下载状态
const downloading = ref(false);

// 处理图片下载
async function handleDownload() {
  if (!imageUrl.value.trim()) return;

  const url = imageUrl.value.trim();
  downloading.value = true;

  try {
    const response = await fetch(url);
    const contentTypeValue = response.headers.get('content-type') || '';
    const imgType = contentTypeValue.split('/')[1];
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop() || 'filename';

    if (imgType === 'webp') {
      console.log('imgType: ', imgType);
      await convertWebpToJpgAndDownload(url, `${filename}.jpg`);
      downloading.value = false;
      return;
    }
    const blob = await response.blob();

    const mimeType = blob.type;
    const extension = mimeType.split('/')[1] || 'png';

    saveAs(blob, `${filename}.${extension}`);
    downloading.value = false;
  } catch (error) {
    console.error('单图下载失败:', error);
    alert('下载失败，请检查图片地址是否正确');
    downloading.value = false;
  }
}

function handleAnimatedWebpDownload(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    const GIF = (window as any).GIF;
    if (!GIF) {
      console.error('GIF.js 库未加载');
      alert('GIF.js 库未加载，无法处理动图');
      downloading.value = false;
      return;
    }

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: img.width,
      height: img.height,
    });
    gif.addFrame(img, { delay: 200 });
    gif.on('finished', function (blob: Blob) {
      saveAs(blob, 'animated_image.gif');
      downloading.value = false;
    });
    gif.render();
  };
  img.onerror = function () {
    console.error('WebP 图片加载失败');
    alert('动图加载失败，请检查图片地址');
    downloading.value = false;
  };
  img.src = url;
}
</script>

<style scoped>
.single-image-downloader {
  margin: 1rem 0;
}
</style>
