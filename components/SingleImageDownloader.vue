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
    if (url.indexOf('webp') > -1) {
      // 处理webp格式图片，转换为jpg
      convertWebpToJpgAndDownload(url, 'single_image.jpg');
    } else if (url.indexOf('awebp') > -1) {
      // 处理动图awebp格式
      handleAnimatedWebpDownload(url);
    } else {
      // 处理普通图片格式
      const response = await fetch(url);
      const blob = await response.blob();
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || 'single_image';
      const mimeType = blob.type;
      const extension = mimeType.split('/')[1] || 'png';
      saveAs(blob, `${filename}.${extension}`);
      downloading.value = false;
    }
  } catch (error) {
    console.error('单图下载失败:', error);
    alert('下载失败，请检查图片地址是否正确');
    downloading.value = false;
  }
}

// 将WebP转换为JPG并下载
function convertWebpToJpgAndDownload(webpUrl, fileName = 'image.jpg') {
  // 创建 img 元素加载 WebP 图片
  const img = new Image();

  // 允许跨域图片
  img.crossOrigin = 'anonymous';

  img.onload = function () {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 设置 canvas 尺寸与图片一致
    canvas.width = img.width;
    canvas.height = img.height;

    // 将图片绘制到 canvas
    ctx.drawImage(img, 0, 0);

    // 将 canvas 内容导出为 JPG
    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = jpgDataUrl;
    link.download = fileName;

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    downloading.value = false;
  };

  img.onerror = function () {
    console.error('WebP 图片加载失败');
    alert('WebP图片加载失败，请检查图片地址');
    downloading.value = false;
  };

  // 开始加载 WebP 图片
  img.src = webpUrl;
}

// 处理动图awebp下载
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