<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <h1 class="text-3xl font-bold mb-8 text-center text-blue-600">
      网速测速工具
    </h1>

    <!-- 测速卡片 -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <!-- 状态显示 -->
      <div class="text-center mb-6" v-if="!isTesting">
        <p class="text-gray-600 mb-2">点击下方按钮开始测速</p>
        <div class="flex justify-center gap-4 mb-4">
          <span class="text-sm bg-gray-100 px-3 py-1 rounded-full" 
            >上次测试: {{ lastTestTime }}</span
          >
          <span class="text-sm bg-gray-100 px-3 py-1 rounded-full" 
            >服务器: {{ selectedServer.name }}</span
          >
        </div>
      </div>

      <!-- 测速过程 -->
      <div v-else class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-gray-700">{{ currentTestPhase }}</span>
          <span class="text-blue-600 font-medium">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>

      <!-- 测速结果 -->
      <div
        v-if="testResults && !isTesting"
        class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">下载速度</p>
          <p class="text-3xl font-bold text-blue-600">
            {{ formatSpeed(testResults.downloadSpeed) }}
          </p>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">上传速度</p>
          <p class="text-3xl font-bold text-green-600">
            {{ formatSpeed(testResults.uploadSpeed) }}
          </p>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">延迟</p>
          <p class="text-3xl font-bold text-purple-600">
            {{ testResults.latency }}ms
          </p>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="flex flex-wrap justify-center gap-4">
        <button
          class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          :disabled="isTesting"
          @click="startFullTest"
        >
          {{ isTesting ? '测速中...' : '完整测速' }}
        </button>
        <button
          class="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          :disabled="isTesting"
          @click="startDownloadTest"
        >
          {{ isTesting ? '测速中...' : '仅下载测速' }}
        </button>
        <button
          class="px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          :disabled="isTesting"
          @click="startUploadTest"
        >
          {{ isTesting ? '测速中...' : '仅上传测速' }}
        </button>
        <button
          class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          :disabled="isTesting || !testResults"
          @click="clearResults"
        >
          清除结果
        </button>
      </div>
    </div>

    <!-- 服务器选择 -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-bold mb-4">选择服务器</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          v-for="server in servers"
          :key="server.id"
          class="px-4 py-2 rounded-lg border transition-all"
          :class="{
            'border-blue-600 bg-blue-50': selectedServer.id === server.id,
            'border-gray-200 hover:border-gray-300':
              selectedServer.id !== server.id,
          }"
          @click="selectServer(server)"
          :disabled="isTesting"
        >
          {{ server.name }}
        </button>
      </div>
    </div>

    <!-- 测速信息 -->
    <div class="bg-gray-50 rounded-xl p-6 text-sm text-gray-600">
      <h2 class="text-lg font-medium mb-2">测速说明</h2>
      <ul class="list-disc list-inside space-y-1">
        <li>完整测速包括延迟测试、下载测速和上传测速</li>
        <li>您也可以选择单独测试下载速度或上传速度</li>
        <li>建议在测速时关闭其他占用网络的应用程序</li>
        <li>测速结果仅供参考，实际网络性能可能因多种因素而异</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 服务器选项
interface Server {
  id: string;
  name: string;
  downloadUrl: string;
}

// 测试结果
interface TestResults {
  downloadSpeed: number;
  uploadSpeed: number;
  latency: number;
}

// 状态变量
const isTesting = ref(false);
const progress = ref(0);
const currentTestPhase = ref('');
const testResults = ref<TestResults | null>(null);
const lastTestTime = ref('暂无');

// 服务器列表
const servers = ref<Server[]>([
  {
    id: 'server1',
    name: '阿里云',
    downloadUrl: 'https://picsum.photos/1000/1000',
  },
  {
    id: 'server2',
    name: '腾讯云',
    downloadUrl: 'https://picsum.photos/1200/1200',
  },
  {
    id: 'server3',
    name: '百度云',
    downloadUrl: 'https://picsum.photos/1500/1500',
  },
]);

const selectedServer = ref<Server>(servers.value[0]);

// 格式化速度显示
const formatSpeed = (speedBytes: number): string => {
  if (speedBytes < 1024) {
    return `${speedBytes.toFixed(2)} B/s`;
  } else if (speedBytes < 1048576) {
    return `${(speedBytes / 1024).toFixed(2)} KB/s`;
  } else {
    return `${(speedBytes / 1048576).toFixed(2)} MB/s`;
  }
};

// 选择服务器
const selectServer = (server: Server) => {
  selectedServer.value = server;
};

// 清除结果
const clearResults = () => {
  testResults.value = null;
  lastTestTime.value = '暂无';
};

// 测试延迟
const testLatency = async (): Promise<number> => {
  currentTestPhase.value = '测试延迟中...';
  progress.value = 10;

  try {
    const startTime = performance.now();
    const response = await fetch(selectedServer.value.downloadUrl, {
      method: 'HEAD',
    });
    const endTime = performance.now();

    if (response.ok) {
      return Math.round(endTime - startTime);
    } else {
      throw new Error('服务器响应错误');
    }
  } catch (error) {
    console.error('延迟测试失败:', error);
    return 9999; // 返回高延迟表示测试失败
  }
};

// 测试下载速度
const testDownloadSpeed = async (): Promise<number> => {
  currentTestPhase.value = '测试下载速度中...';
  
  // 如果是单独测试下载速度，进度从0开始
  if (progress.value === 0) {
    progress.value = 10;
  }

  try {
    const startTime = performance.now();
    const response = await fetch(selectedServer.value.downloadUrl);
    const blob = await response.blob();
    const endTime = performance.now();

    const fileSize = blob.size;
    const duration = (endTime - startTime) / 1000; // 转换为秒
    const speed = fileSize / duration; // 字节/秒

    // 如果是单独测试下载速度，进度直接到100
    if (progress.value === 10) {
      progress.value = 100;
    } else {
      progress.value = 60;
    }
    return speed;
  } catch (error) {
    console.error('下载测速失败:', error);
    throw new Error('下载测速失败');
  }
};

// 测试上传速度
const testUploadSpeed = async (): Promise<number> => {
  currentTestPhase.value = '测试上传速度中...';
  
  // 如果是单独测试上传速度，进度从0开始
  if (progress.value === 0) {
    progress.value = 10;
  }

  try {
    // 创建一个1MB的随机数据
    const dataSize = 1024 * 1024; // 1MB
    const arrayBuffer = new ArrayBuffer(dataSize);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = Math.floor(Math.random() * 256);
    }
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });

    const startTime = performance.now();
    // 使用fetch上传数据到一个通用的测试端点
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: blob,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error('上传测试失败');
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // 转换为秒
    const speed = dataSize / duration; // 字节/秒

    // 如果是单独测试上传速度，进度直接到100
    if (progress.value === 10) {
      progress.value = 100;
    } else {
      progress.value = 90;
    }
    return speed;
  } catch (error) {
    console.error('上传测速失败:', error);
    throw new Error('上传测速失败');
  }
};

// 完整测速
const startFullTest = async () => {
  isTesting.value = true;
  progress.value = 0;
  
  // 如果已有测试结果，保留已有数据
  const previousResults = { ...testResults.value };

  try {
    // 依次执行测试
    const latency = await testLatency();
    const downloadSpeed = await testDownloadSpeed();
    const uploadSpeed = await testUploadSpeed();

    // 保存测试结果
    testResults.value = {
      downloadSpeed,
      uploadSpeed,
      latency,
    };

    // 更新上次测试时间
    const now = new Date();
    lastTestTime.value = now.toLocaleString();

    progress.value = 100;
    currentTestPhase.value = '测速完成';

    // 显示完成状态
    setTimeout(() => {
      isTesting.value = false;
    }, 1000);
  } catch (error) {
    console.error('测速失败:', error);
    // 如果出错，恢复到之前的结果
    if (previousResults) {
      testResults.value = previousResults;
    }
    isTesting.value = false;
    currentTestPhase.value = '测速失败，请重试';
  }
};

// 单独下载测速
const startDownloadTest = async () => {
  isTesting.value = true;
  progress.value = 0;
  
  // 保存当前结果，仅更新下载速度
  const currentResults = testResults.value;

  try {
    // 执行下载测速
    const downloadSpeed = await testDownloadSpeed();

    // 更新测试结果
    if (currentResults) {
      // 保留现有上传速度和延迟数据
      testResults.value = {
        ...currentResults,
        downloadSpeed,
      };
    } else {
      // 如果没有现有结果，创建新结果
      const latency = await testLatency();
      testResults.value = {
        downloadSpeed,
        uploadSpeed: 0,
        latency,
      };
    }

    // 更新上次测试时间
    const now = new Date();
    lastTestTime.value = now.toLocaleString();

    progress.value = 100;
    currentTestPhase.value = '下载测速完成';

    // 显示完成状态
    setTimeout(() => {
      isTesting.value = false;
    }, 1000);
  } catch (error) {
    console.error('下载测速失败:', error);
    isTesting.value = false;
    currentTestPhase.value = '下载测速失败，请重试';
  }
};

// 单独上传测速
const startUploadTest = async () => {
  isTesting.value = true;
  progress.value = 0;
  
  // 保存当前结果，仅更新上传速度
  const currentResults = testResults.value;

  try {
    // 执行上传测速
    const uploadSpeed = await testUploadSpeed();

    // 更新测试结果
    if (currentResults) {
      // 保留现有下载速度和延迟数据
      testResults.value = {
        ...currentResults,
        uploadSpeed,
      };
    } else {
      // 如果没有现有结果，创建新结果
      const latency = await testLatency();
      testResults.value = {
        downloadSpeed: 0,
        uploadSpeed,
        latency,
      };
    }

    // 更新上次测试时间
    const now = new Date();
    lastTestTime.value = now.toLocaleString();

    progress.value = 100;
    currentTestPhase.value = '上传测速完成';

    // 显示完成状态
    setTimeout(() => {
      isTesting.value = false;
    }, 1000);
  } catch (error) {
    console.error('上传测速失败:', error);
    isTesting.value = false;
    currentTestPhase.value = '上传测速失败，请重试';
  }
};

// 组件挂载时的初始化
onMounted(() => {
  // 可以在这里加载历史测试数据
});
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>
