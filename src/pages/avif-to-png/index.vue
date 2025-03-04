<template>
  <div class="container">
    <input type="file" @change="handleFileUpload" accept=".avif" />

    <!-- 预览区域 -->
    <div v-show="showPreview" class="preview-container">
      <h3>原始 AVIF 预览：</h3>
      <canvas ref="previewCanvas"></canvas>

      <!-- <h3 style="margin-top: 20px;">转换后 PNG 预览：</h3> -->
      <!-- <img :src="previewImageUrl" class="preview-image" /> -->

      <a v-show="downloadUrl" :href="downloadUrl" :download="downloadFilename" class="download-link">
        下载 PNG
      </a>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">转换中...</div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 响应式数据
const previewCanvas = ref(null);
const previewImageUrl = ref('');
const downloadUrl = ref('');
const downloadFilename = ref('');
const showPreview = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  resetState();
  isLoading.value = true;

  try {
    // 1. 读取文件
    const avifData = await file.arrayBuffer();

    // 2. 解码 AVIF
    const blob = new Blob([avifData], { type: 'image/avif' });
    const imgBitmap = await createImageBitmap(blob);

    // 3. 绘制到 Canvas
    const canvas = previewCanvas.value;
    canvas.width = imgBitmap.width;
    canvas.height = imgBitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgBitmap, 0, 0);

    // 4. 生成 PNG
    const pngDataURL = canvas.toDataURL('image/png');

    // 更新预览数据
    // previewImageUrl.value = pngDataURL;
    downloadUrl.value = pngDataURL;
    downloadFilename.value = file.name.replace(/\.avif$/, '.png');
    showPreview.value = true;

    // 释放资源
    imgBitmap.close();
  } catch (error) {
    errorMessage.value = `转换失败：${error.message}`;
    console.error('AVIF 转换错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 重置状态
const resetState = () => {
  previewImageUrl.value = '';
  downloadUrl.value = '';
  showPreview.value = false;
  errorMessage.value = '';
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.preview-container {
  margin-top: 20px;
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 8px;
}

.preview-image {
  max-width: 100%;
  border: 1px solid #ddd;
  margin-top: 10px;
}

canvas {
  max-width: 100%;
  border: 1px solid #ccc;
}

.download-link {
  display: inline-block;
  margin-top: 15px;
  padding: 8px 15px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.loading {
  color: #666;
  margin-top: 10px;
}

.error {
  color: #dc3545;
  margin-top: 10px;
}
</style>