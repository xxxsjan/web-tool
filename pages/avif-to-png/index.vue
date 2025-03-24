<template>
  <div class="container">
    <!-- 修改文件上传区域 -->
    <div class="upload-container">
      <label class="upload-area">
        <input type="file" @change="handleFileUpload" accept=".avif" class="file-input" />
        <div class="upload-content">
          <el-icon size="40">
            <Upload />
          </el-icon>
          <p class="upload-text">点击选择 AVIF 文件 或 拖放至此</p>
          <p class="upload-subtext">支持单文件转换，最大 10MB</p>
        </div>
      </label>
    </div>

    <!-- 预览区域 -->
    <div v-show="showPreview" class="preview-container">
      <h3>原始 AVIF 预览：</h3>
      <canvas ref="previewCanvas"></canvas>

      <!-- <h3 style="margin-top: 20px;">转换后 PNG 预览：</h3> -->
      <!-- <img :src="previewImageUrl" class="preview-image" /> -->

      <!-- 优化下载链接 -->
      <a v-show="downloadUrl" :href="downloadUrl" :download="downloadFilename" class="download-link">

        立即下载 PNG
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
import { Upload } from '@element-plus/icons-vue';

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
  margin: 40px auto;
  padding: 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.upload-container {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.upload-area {
  display: block;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
}

.upload-area:hover {
  background: #f8fafc;
  border-color: #3b82f6;
}

.file-input {
  display: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  stroke: #64748b;
}

.upload-text {
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.upload-subtext {
  color: #64748b;
  font-size: 0.875rem;
}

.preview-container {
  margin-top: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

canvas {
  max-width: 100%;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 优化下载链接 */
.download-link {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  transition: background 0.2s;
}

.download-link:hover {
  background: #2563eb;
}

.download-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  stroke: white;
}

.loading {
  padding: 16px;
  background: #e2e8f0;
  border-radius: 6px;
  text-align: center;
}

.error {
  padding: 16px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  display: flex;
  align-items: center;
}
</style>