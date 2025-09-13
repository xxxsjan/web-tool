<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 md:p-8"
  >
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1
          class="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2"
        >
          视频转音频工具
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          频转音频失败 轻松将您的视频文件转换为高质量音频
        </p>
      </div>

      <!-- 主内容区域 -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl"
      >
        <!-- 文件选择区域 -->
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-400"
          @click="triggerFileInput"
          :class="{ 'border-blue-500 dark:border-blue-400': selectedFile }"
        >
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            class="hidden"
            @change="handleFileSelect"
          />

          <div class="flex flex-col items-center justify-center">
            <div
              class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4"
            >
              <!-- 替换为Font Awesome上传图标 -->
              <i
                class="fas fa-upload text-2xl text-blue-600 dark:text-blue-400"
              ></i>
            </div>

            <p class="text-gray-600 dark:text-gray-300 mb-2">
              点击或拖拽视频文件到此处
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              支持 MP4、AVI、MKV 等常见视频格式
            </p>

            <!-- 选中文件显示 -->
            <div
              v-if="selectedFile"
              class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md inline-flex items-center"
            >
              <!-- 替换为Font Awesome文件图标 -->
              <i
                class="fas fa-file-video text-blue-600 dark:text-blue-400 mr-2 text-lg"
              ></i>
              <span
                class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs"
              >
                {{ selectedFile.name }}
              </span>
              <button
                @click.stop="removeFile"
                class="ml-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400"
              >
                <!-- 替换为Font Awesome关闭图标 -->
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
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="wma">WMA</option>
              <option value="ogg">OGG</option>
              <option value="aac">AAC</option>
              <option value="au">AU</option>
              <option value="flac">FLAC</option>
              <option value="m4a">M4A</option>
              <option value="mka">MKA</option>
              <option value="aiff">AIFF</option>
              <option value="opus">OPUS</option>
              <option value="ra">RA</option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300"
            >
              <!-- 替换为Font Awesome向下箭头图标 -->
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            @click="convertToAudio"
            :disabled="!selectedFile || isConverting"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center"
          >
            <!-- 替换为Font Awesome加载图标 -->
            <i
              v-if="isConverting"
              class="fas fa-spinner fa-spin -ml-1 mr-2"
            ></i>
            {{ isConverting ? '转换中...' : '转换为音频' }}
          </button>

          <button
            @click="removeFile"
            :disabled="!selectedFile || isConverting"
            class="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-6 rounded-lg transition-all"
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
            <!-- 替换为Font Awesome错误图标 -->
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

          <!-- 音频播放器 -->
          <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <audio :src="audioUrl" controls class="w-full">
              您的浏览器不支持音频播放
            </audio>
          </div>

          <!-- 下载按钮 -->
          <div class="mt-4 flex">
            <a
              :href="audioUrl"
              :download="audioFileName"
              class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-all flex items-center"
            >
              <!-- 仅保留Font Awesome下载图标 -->
              <i class="fas fa-download mr-2"></i>
              下载音频文件
            </a>
          </div>
        </div>
      </div>

      <!-- 页脚信息 -->
      <div class="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p class="mt-1">支持的格式: MP4, AVI, MKV, MOV 等</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 文件相关状态
const fileInput = ref(null);
const selectedFile = ref(null);
const videoUrl = ref('');
const audioUrl = ref('');
const audioFileName = ref('converted-audio.mp3');
const selectedFormat = ref('mp3'); // 默认选择MP3格式

// 转换相关状态
const isConverting = ref(false);
const conversionProgress = ref(0);
const conversionStatus = ref('准备转换...');
const errorMessage = ref('');

// 触发文件选择对话框
const triggerFileInput = () => {
  if (!isConverting.value) {
    fileInput.value?.click();
  }
};

// 处理文件选择
const handleFileSelect = event => {
  const file = event.target.files[0];
  if (file) {
    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      showError('请选择有效的视频文件');
      return;
    }

    // 清除之前的状态
    resetState();

    // 设置新文件
    selectedFile.value = file;

    // 创建视频预览URL
    videoUrl.value = URL.createObjectURL(file);
  }
};

// 移除已选文件
const removeFile = () => {
  resetState();
  fileInput.value.value = '';
};

// 重置状态
const resetState = () => {
  selectedFile.value = null;
  videoUrl.value = '';
  audioUrl.value = '';
  isConverting.value = false;
  conversionProgress.value = 0;
  conversionStatus.value = '准备转换...';
  errorMessage.value = '';
  selectedFormat.value = 'mp3'; // 重置为默认格式

  // 清理URL对象，避免内存泄漏
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value);
  }
};

// 显示错误消息
const showError = message => {
  errorMessage.value = message;
  isConverting.value = false;

  // 3秒后自动隐藏错误消息
  setTimeout(() => {
    errorMessage.value = '';
  }, 5000);
};

// 模拟转换进度更新
const simulateProgress = () => {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (conversionProgress.value < 90) {
        // 随机增加进度
        const increment = Math.random() * 10;
        conversionProgress.value = Math.min(
          conversionProgress.value + increment,
          90,
        );

        // 更新状态文本
        if (conversionProgress.value < 30) {
          conversionStatus.value = '正在解析视频文件...';
        } else if (conversionProgress.value < 60) {
          conversionStatus.value = '正在提取音频轨道...';
        } else {
          conversionStatus.value = '正在编码音频文件...';
        }
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 300);
  });
};

// 转换视频到音频
const convertToAudio = async () => {
  if (!selectedFile.value || isConverting.value) {
    return;
  }

  isConverting.value = true;
  conversionProgress.value = 0;
  errorMessage.value = '';
  audioUrl.value = '';

  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('video', selectedFile.value);
    formData.append('format', selectedFormat.value); // 使用用户选择的格式

    // 模拟进度（实际项目中可以移除这部分）
    await simulateProgress();

    // 发送请求到后端接口
    const response = await fetch('/api/convertVideoToAudio', {
      method: 'POST',
      body: formData,
    });

    // 完成进度
    conversionProgress.value = 100;
    conversionStatus.value = '转换完成！';

    if (!response.ok) {
      // 尝试解析错误信息
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error('转换失败，请重试');
      }
      throw new Error(errorData.message || '转换失败，请重试');
    }

    // 获取文件名
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match && match[1]) {
        audioFileName.value = match[1];
      } else {
        // 使用原始文件名生成音频文件名
        const originalName = selectedFile.value.name;
        const nameWithoutExt =
          originalName.substring(0, originalName.lastIndexOf('.')) ||
          originalName;
        audioFileName.value = `${nameWithoutExt}.${selectedFormat.value}`;
      }
    }

    // 获取音频数据并创建下载URL
    const blob = await response.blob();
    audioUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    console.error('转换错误:', error);
    showError(`转换失败: ${error.message}`);
  } finally {
    isConverting.value = false;
  }
};

// 组件挂载时检查黑暗模式偏好
onMounted(() => {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    document.documentElement.classList.add('dark');
  }
});
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

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

/* 黑暗模式下的滚动条 */
.dark ::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark {
  color-scheme: dark;
}
</style>
