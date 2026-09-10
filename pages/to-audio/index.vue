<template>
  <div class="mx-auto w-full max-w-3xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        视频转音频
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        上传视频 → 选择格式 → 提取音频下载
      </p>
    </header>

    <section
      class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm"
    >
      <!-- 上传区 -->
      <div
        class="relative m-4 overflow-hidden rounded-xl border-2 border-dashed transition-colors sm:m-5"
        :class="
          isDragging
            ? 'border-primary bg-primary/10'
            : selectedFile
              ? 'border-primary/40 bg-base-200/30'
              : 'border-base-content/20 hover:border-primary/60 hover:bg-base-200/40'
        "
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
          class="sr-only"
          @change="handleFileSelect"
        />

        <div
          class="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:min-h-[200px]"
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

          <div>
            <p class="text-base font-medium text-base-content">
              {{
                isDragging ? '松开即可上传视频' : '点击或拖拽视频到此处'
              }}
            </p>
            <p class="mt-1 text-xs text-base-content/50">
              MP4 / AVI / MKV / MOV / WebM · 不超过 200MB
            </p>
          </div>

          <div
            v-if="selectedFile"
            class="inline-flex max-w-full items-center gap-2 rounded-lg border border-base-300/60 bg-base-100 px-3 py-2"
            @click.stop
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 shrink-0 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <div class="min-w-0 text-left">
              <p class="truncate text-sm font-medium text-base-content">
                {{ selectedFile.name }}
              </p>
              <p class="text-[11px] text-base-content/50">
                {{ formatBytes(selectedFile.size) }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle shrink-0"
              :disabled="isConverting"
              aria-label="移除文件"
              @click="removeFile"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 有文件后的操作区 -->
      <div v-if="selectedFile" class="space-y-5 border-t border-base-300/50 p-4 sm:p-5">
        <!-- 预览 -->
        <div
          v-if="videoUrl"
          class="overflow-hidden rounded-xl border border-base-300/60 bg-neutral"
        >
          <video
            :src="videoUrl"
            controls
            class="mx-auto max-h-[280px] w-full object-contain"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 格式选择 -->
        <div>
          <p class="mb-2 text-sm font-medium text-base-content/70">
            输出格式
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="item in audioFormats"
              :key="item.value"
              type="button"
              class="btn btn-sm sm:btn-md"
              :class="
                selectedFormat === item.value
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="isConverting"
              @click="selectedFormat = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="btn btn-primary flex-1"
            :disabled="isConverting"
            @click="convertToAudio"
          >
            <span
              v-if="isConverting"
              class="loading loading-spinner loading-sm"
            ></span>
            {{ isConverting ? '转换中…' : '转换为音频' }}
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 sm:w-28"
            :disabled="isConverting"
            @click="removeFile"
          >
            重选
          </button>
        </div>

        <!-- 进度 -->
        <div v-if="isConverting" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-base-content/60">{{ conversionStatus }}</span>
            <span class="font-mono text-base-content">{{ conversionProgress }}%</span>
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="conversionProgress"
            max="100"
          ></progress>
        </div>

        <!-- 错误 -->
        <div
          v-if="errorMessage"
          class="rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
        >
          {{ errorMessage }}
        </div>

        <!-- 结果 -->
        <div
          v-if="audioUrl"
          class="space-y-3 rounded-xl border border-success/25 bg-success/5 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-base-content">转换结果</h3>
            <span
              v-if="audioFileSize"
              class="badge badge-ghost badge-sm font-mono"
            >
              {{ formatBytes(audioFileSize) }}
            </span>
          </div>

          <audio :src="audioUrl" controls class="w-full">
            您的浏览器不支持音频播放
          </audio>

          <div class="flex flex-wrap items-center gap-2">
            <a
              :href="audioUrl"
              :download="audioFileName"
              class="btn btn-success btn-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              下载 {{ selectedFormat.toUpperCase() }}
            </a>
            <span class="truncate text-xs text-base-content/50">
              {{ audioFileName }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <p class="mt-5 text-center text-[11px] text-base-content/40 sm:text-xs">
      支持 MP4、AVI、MKV、MOV、WebM · 输出 MP3 / WAV / AAC
    </p>
  </div>
</template>

<script setup>
definePageMeta({
  tool: true,
  title: '🎤视频转音频',
  group: '媒体类',
});

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
