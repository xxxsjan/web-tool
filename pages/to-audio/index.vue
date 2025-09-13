<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- 导航栏 -->
    <header class="bg-white shadow-sm">
      <div
        class="container mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-2xl font-bold text-gray-800">音频转换工具</h1>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="flex-grow container mx-auto px-4 py-8">
      <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-6 text-gray-800">转换音频格式</h2>

        <!-- 1. 文件/链接切换与选择 -->
        <div class="mb-6">
          <div class="flex mb-4">
            <button
              @click="switchSource('file')"
              :class="[
                'px-4 py-2 rounded-l-md',
                sourceType === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700',
              ]"
            >
              本地文件
            </button>
            <button
              @click="switchSource('url')"
              :class="[
                'px-4 py-2 rounded-r-md',
                sourceType === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700',
              ]"
            >
              在线链接
            </button>
          </div>

          <div v-if="sourceType === 'file'">
            <label class="block mb-2 text-gray-700">选择文件（最大200M）</label>
            <input
              type="file"
              @change="handleFileSelect"
              accept=".mp4,.avi,.mov,.wav,.mp3,.flac,.ogg"
              class="border border-gray-300 rounded-md p-2 w-full"
            />
            <p v-if="selectedFile" class="mt-2 text-sm text-gray-600">
              已选择: {{ selectedFile.name }} ({{
                formatFileSize(selectedFile.size)
              }})
            </p>
            <p v-if="fileError" class="mt-2 text-sm text-red-600">
              {{ fileError }}
            </p>
          </div>

          <div v-else>
            <label class="block mb-2 text-gray-700">在线文件URL</label>
            <input
              type="text"
              v-model="fileUrl"
              placeholder="输入音频或视频文件的URL"
              class="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
        </div>

        <!-- 2. 目标格式、比特率、采样率设置 -->
        <div class="mb-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block mb-1 text-gray-700">目标格式</label>
              <select
                v-model="targetFormat"
                class="border border-gray-300 rounded-md p-2 w-full"
              >
                <option value="WAV">WAV</option>
                <option value="WMA">WMA</option>
                <option value="MP3">MP3</option>
                <option value="OGG">OGG</option>
                <option value="AAC">AAC</option>
                <option value="AU">AU</option>
                <option value="FLAC">FLAC</option>
                <option value="M4A">M4A</option>
                <option value="MKA">MKA</option>
                <option value="AIFF">AIFF</option>
                <option value="OPUS">OPUS</option>
                <option value="RA">RA</option>
              </select>
            </div>

            <div>
              <label class="block mb-1 text-gray-700">比特率</label>
              <select
                v-model="bitrate"
                class="border border-gray-300 rounded-md p-2 w-full"
              >
                <option value="original">保持原样</option>
                <option value="128k">128 kbps</option>
                <option value="192k">192 kbps</option>
                <option value="320k">320 kbps</option>
              </select>
            </div>

            <div>
              <label class="block mb-1 text-gray-700">采样率</label>
              <select
                v-model="samplerate"
                class="border border-gray-300 rounded-md p-2 w-full"
              >
                <option value="original">保持原样</option>
                <option value="44100">44100 Hz</option>
                <option value="48000">48000 Hz</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. 转换按钮与结果展示 -->
        <div class="mb-6">
          <button
            @click="convertAudio"
            :disabled="!canConvert || isConverting"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition disabled:bg-gray-400"
          >
            <span v-if="!isConverting">开始转换</span>
            <span v-if="isConverting">
              <i class="fa fa-spinner fa-spin mr-2"></i>转换中...
            </span>
          </button>
        </div>

        <!-- 转换结果 -->
        <div
          v-if="conversionResult"
          class="p-4 bg-green-50 border border-green-200 rounded-md"
        >
          <h3 class="font-medium text-green-800 mb-2">转换成功！</h3>
          <p class="text-green-700 mb-3">文件已准备好下载和试听</p>
          
          <!-- 新增试听功能 -->
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">试听转换结果：</p>
            <audio
              :src="conversionResult.audioUrl"
              controls
              class="w-full"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>
          
          <a
            :href="conversionResult.downloadUrl"
            download
            class="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <i class="fa fa-download mr-2"></i>
            下载 {{ conversionResult.filename }}
          </a>
        </div>

        <!-- 错误提示 -->
        <div
          v-if="errorMessage"
          class="p-4 bg-red-50 border border-red-200 rounded-md text-red-700"
        >
          <i class="fa fa-exclamation-circle mr-2"></i>{{ errorMessage }}
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-800 text-white py-6">
      <div class="container mx-auto px-4 text-center">
        <p>音频转换工具 &copy; {{ new Date().getFullYear() }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFetch } from 'nuxt/app';
definePageMeta({
  title: '音频转换工具',
  meta: [
    { charset: 'utf-8' },
    { 
      hid: 'description',
      name: 'description',
      content: '在线音频转换工具，支持多种格式转换和试听',
    },
  ],
});
// 状态管理
const sourceType = ref('file'); // 'file' 或 'url'
const selectedFile = ref(null);
const fileUrl = ref('');
const targetFormat = ref('MP3');
const bitrate = ref('original');
const samplerate = ref('original');
const conversionResult = ref(null);
const isConverting = ref(false);
const errorMessage = ref('');
const fileError = ref('');

// 计算属性：判断是否可以转换
const canConvert = computed(() => {
  if (sourceType.value === 'file') {
    return !!selectedFile.value && !fileError.value;
  } else {
    return fileUrl.value.trim() !== '';
  }
});

// 方法：切换文件/链接模式
const switchSource = type => {
  sourceType.value = type;
  errorMessage.value = '';
  conversionResult.value = null;
};

// 方法：处理文件选择
const handleFileSelect = e => {
  const file = e.target.files[0];
  fileError.value = '';

  if (file) {
    // 检查文件大小（200M限制）
    if (file.size > 200 * 1024 * 1024) {
      fileError.value = '文件大小不能超过200M';
      selectedFile.value = null;
      e.target.value = ''; // 清空选择
      return;
    }

    selectedFile.value = file;
  }
};

// 方法：格式化文件大小
const formatFileSize = bytes => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 方法：提交转换请求
const convertAudio = async () => {
  isConverting.value = true;
  errorMessage.value = '';
  conversionResult.value = null;

  try {
    // 模拟转换过程的延时
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let downloadUrl = '#';
    let audioUrl = '#';
    
    // 处理本地文件的情况
    if (sourceType.value === 'file' && selectedFile.value) {
      // 对于实际项目，这里应该是发送到后端处理后的URL
      // 这里我们创建一个Blob URL来模拟转换结果，以便可以试听
      const blob = new Blob([await selectedFile.value.arrayBuffer()], {
        type: selectedFile.value.type
      });
      
      // 创建可下载的URL
      downloadUrl = URL.createObjectURL(blob);
      audioUrl = downloadUrl;
    }
    
    // 对于URL的情况，可以直接使用原URL进行试听
    // 注意：实际项目中应该使用后端转换后的URL
    if (sourceType.value === 'url' && fileUrl.value) {
      audioUrl = fileUrl.value;
    }

    conversionResult.value = {
      filename: `converted.${targetFormat.value.toLowerCase()}`,
      downloadUrl: downloadUrl,
      audioUrl: audioUrl
    };
  } catch (err) {
    errorMessage.value = '转换失败，请稍后重试';
    console.error('转换错误:', err);
  } finally {
    isConverting.value = false;
  }
};
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
</style>
