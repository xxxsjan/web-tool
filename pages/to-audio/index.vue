<template>
  <div class="min-h-screen p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1
          class="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2"
        >
          视频转音频工具
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          轻松将视频文件转换为高质量音频，支持多种常见格式
        </p>
      </div>

      <!-- 主内容区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl"
      >
        <!-- 文件选择区域 -->
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-400"
          :class="{
            'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20':
              selectedFile || isDragging,
          }"
          @click="triggerFileInput"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept="video/*,.mp4,.avi,.mkv,.mov,.webm,.flv,.wmv,.m4v"
            class="hidden"
            @change="handleFileSelect"
          />

          <div class="flex flex-col items-center justify-center">
            <div
              class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"
            >
              <i
                class="fas fa-upload text-2xl text-blue-600 dark:text-blue-400"
              ></i>
            </div>

            <p class="text-gray-600 dark:text-gray-300 mb-2">
              {{
                isDragging
                  ? '松开即可上传视频'
                  : '点击或拖拽视频文件到此处'
              }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              支持 MP4、AVI、MKV、MOV、WebM 等，单文件不超过 200MB
            </p>

            <!-- 选中文件显示 -->
            <div
              v-if="selectedFile"
              class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md inline-flex items-center max-w-full"
            >
              <i
                class="fas fa-file-video text-blue-600 dark:text-blue-400 mr-2 text-lg shrink-0"
              ></i>
              <div class="min-w-0 text-left">
                <p
                  class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs"
                >
                  {{ selectedFile.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatBytes(selectedFile.size) }}
                </p>
              </div>
              <button
                type="button"
                @click.stop="removeFile"
                class="ml-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 shrink-0"
                :disabled="isConverting"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 视频预览区域 -->
        <div v-if="videoUrl" class="mt-6">
          <div class="bg-gray-900 rounded-lg overflow-hidden">
            <video
              :src="videoUrl"
              controls
              class="w-full max-h-[300px] object-contain"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>

        <!-- 音频格式选择区域 -->
        <div v-if="selectedFile" class="mt-6">
          <label
            class="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2"
          >
            选择输出音频格式
          </label>
          <div class="relative">
            <select
              v-model="selectedFormat"
              :disabled="isConverting"
              class="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
            >
              <option
                v-for="item in audioFormats"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300"
            >
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            @click="convertToAudio"
            :disabled="!selectedFile || isConverting"
            class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center"
          >
            <i
              v-if="isConverting"
              class="fas fa-spinner fa-spin -ml-1 mr-2"
            ></i>
            {{ isConverting ? '转换中...' : '转换为音频' }}
          </button>

          <button
            type="button"
            @click="removeFile"
            :disabled="!selectedFile || isConverting"
            class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-all"
          >
            重新选择
          </button>
        </div>

        <!-- 转换进度条 -->
        <div v-if="isConverting" class="mt-6">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >转换进度</span
            >
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200"
              >{{ conversionProgress }}%</span
            >
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              :style="{ width: conversionProgress + '%' }"
            ></div>
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ conversionStatus }}
          </p>
        </div>

        <!-- 错误消息区域 -->
        <div
          v-if="errorMessage"
          class="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div class="flex items-start">
            <i class="fas fa-exclamation-circle text-red-500 mr-2 mt-0.5"></i>
            <p class="text-red-700 dark:text-red-300 text-sm">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <!-- 结果区域 -->
        <div
          v-if="audioUrl"
          class="mt-8 p-6 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            转换结果
          </h3>

          <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <audio :src="audioUrl" controls class="w-full">
              您的浏览器不支持音频播放
            </audio>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <a
              :href="audioUrl"
              :download="audioFileName"
              class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-all inline-flex items-center"
            >
              <i class="fas fa-download mr-2"></i>
              下载音频文件
            </a>
            <span
              v-if="audioFileSize"
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              {{ audioFileName }} · {{ formatBytes(audioFileSize) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 页脚信息 -->
      <div class="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>支持的视频格式：MP4、AVI、MKV、MOV、WebM 等</p>
        <p class="mt-1">输出格式：MP3、WAV、AAC</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onUnmounted, ref } from 'vue';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const VIDEO_EXTENSIONS = [
  'mp4',
  'avi',
  'mkv',
  'mov',
  'webm',
  'flv',
  'wmv',
  'm4v',
  'mpeg',
  'mpg',
  '3gp',
];

const audioFormats = [
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'aac', label: 'AAC' },
];

const fileInput = ref(null);
const selectedFile = ref(null);
const videoUrl = ref('');
const audioUrl = ref('');
const audioFileName = ref('converted-audio.mp3');
const audioFileSize = ref(0);
const selectedFormat = ref('mp3');
const isDragging = ref(false);
const dragCounter = ref(0);

const isConverting = ref(false);
const conversionProgress = ref(0);
const conversionStatus = ref('准备转换...');
const errorMessage = ref('');
let errorTimer = null;
let activeXhr = null;

const formatBytes = bytes => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isVideoFile = file => {
  if (file.type?.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return VIDEO_EXTENSIONS.includes(ext);
};

const revokeUrl = url => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

const clearErrorTimer = () => {
  if (errorTimer) {
    clearTimeout(errorTimer);
    errorTimer = null;
  }
};

const showError = message => {
  clearErrorTimer();
  errorMessage.value = message;
  isConverting.value = false;
  errorTimer = setTimeout(() => {
    errorMessage.value = '';
    errorTimer = null;
  }, 6000);
};

const triggerFileInput = () => {
  if (!isConverting.value) {
    fileInput.value?.click();
  }
};

const resetMediaState = () => {
  revokeUrl(videoUrl.value);
  revokeUrl(audioUrl.value);
  selectedFile.value = null;
  videoUrl.value = '';
  audioUrl.value = '';
  audioFileSize.value = 0;
  isConverting.value = false;
  conversionProgress.value = 0;
  conversionStatus.value = '准备转换...';
  errorMessage.value = '';
  clearErrorTimer();
};

const setSelectedFile = file => {
  if (!file) return;

  if (!isVideoFile(file)) {
    showError('请选择有效的视频文件');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showError('视频文件过大，请上传不超过 200MB 的文件');
    return;
  }

  resetMediaState();
  selectedFile.value = file;
  videoUrl.value = URL.createObjectURL(file);
};

const handleFileSelect = event => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedFile(file);
  }
};

const removeFile = () => {
  if (isConverting.value) return;
  if (activeXhr) {
    activeXhr.abort();
    activeXhr = null;
  }
  resetMediaState();
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const onDragEnter = () => {
  if (isConverting.value) return;
  dragCounter.value += 1;
  isDragging.value = true;
};

const onDragOver = () => {
  if (isConverting.value) return;
  isDragging.value = true;
};

const onDragLeave = () => {
  dragCounter.value = Math.max(0, dragCounter.value - 1);
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
};

const onDrop = event => {
  dragCounter.value = 0;
  isDragging.value = false;
  if (isConverting.value) return;

  const file = event.dataTransfer?.files?.[0];
  if (file) {
    setSelectedFile(file);
  }
};

const parseFileNameFromDisposition = header => {
  if (!header) return '';

  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/["']/g, ''));
    } catch {
      // ignore decode error
    }
  }

  const plainMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (plainMatch?.[1]) return plainMatch[1];

  const plainMatch2 = header.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch2?.[1]) return plainMatch2[1].trim().replace(/["']/g, '');

  return '';
};

const buildDefaultAudioName = () => {
  const originalName = selectedFile.value?.name || 'converted-audio';
  const nameWithoutExt =
    originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  return `${nameWithoutExt}.${selectedFormat.value}`;
};

const requestConvert = formData =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhr = xhr;

    xhr.open('POST', '/api/convertVideoToAudio');
    xhr.responseType = 'blob';

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return;
      const uploadPercent = Math.round((event.loaded / event.total) * 70);
      conversionProgress.value = Math.min(uploadPercent, 70);
      conversionStatus.value = '正在上传视频文件...';
    };

    xhr.upload.onload = () => {
      conversionProgress.value = Math.max(conversionProgress.value, 75);
      conversionStatus.value = '服务器正在提取并编码音频...';
    };

    xhr.onprogress = () => {
      if (conversionProgress.value < 90) {
        conversionProgress.value = 90;
        conversionStatus.value = '正在接收音频文件...';
      }
    };

    xhr.onload = () => {
      activeXhr = null;
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        blob: xhr.response,
        contentType: xhr.getResponseHeader('content-type') || '',
        contentDisposition: xhr.getResponseHeader('content-disposition') || '',
      });
    };

    xhr.onerror = () => {
      activeXhr = null;
      reject(new Error('网络错误，请检查网络后重试'));
    };

    xhr.onabort = () => {
      activeXhr = null;
      reject(new Error('转换已取消'));
    };

    xhr.send(formData);
  });

const readErrorMessage = async blob => {
  try {
    const text = await blob.text();
    const data = JSON.parse(text);
    return data.message || data.statusMessage || '转换失败，请重试';
  } catch {
    return '转换失败，请重试';
  }
};

const convertToAudio = async () => {
  if (!selectedFile.value || isConverting.value) {
    return;
  }

  isConverting.value = true;
  conversionProgress.value = 0;
  conversionStatus.value = '准备上传...';
  errorMessage.value = '';
  clearErrorTimer();

  revokeUrl(audioUrl.value);
  audioUrl.value = '';
  audioFileSize.value = 0;

  try {
    const formData = new FormData();
    formData.append('video', selectedFile.value);
    formData.append('format', selectedFormat.value);

    const response = await requestConvert(formData);

    if (!response.ok) {
      const message = await readErrorMessage(response.blob);
      throw new Error(message);
    }

    const contentType = response.contentType.toLowerCase();
    if (contentType.includes('application/json')) {
      const message = await readErrorMessage(response.blob);
      throw new Error(message);
    }

    const parsedName = parseFileNameFromDisposition(response.contentDisposition);
    audioFileName.value = parsedName || buildDefaultAudioName();
    audioFileSize.value = response.blob.size || 0;
    audioUrl.value = URL.createObjectURL(response.blob);

    conversionProgress.value = 100;
    conversionStatus.value = '转换完成！';
  } catch (error) {
    console.error('转换错误:', error);
    showError(`转换失败: ${error.message || '未知错误'}`);
  } finally {
    isConverting.value = false;
    activeXhr = null;
  }
};

onUnmounted(() => {
  if (activeXhr) {
    activeXhr.abort();
    activeXhr = null;
  }
  clearErrorTimer();
  revokeUrl(videoUrl.value);
  revokeUrl(audioUrl.value);
});
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.dark ::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
