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
          <span v-if="clientIp" class="text-sm bg-gray-100 px-3 py-1 rounded-full" 
            >IP: {{ clientIp }}</span
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
            {{ testResults.downloadSpeed }} Mbps
          </p>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">上传速度</p>
          <p class="text-3xl font-bold text-green-600">
            {{ testResults.uploadSpeed }} Mbps
          </p>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">延迟</p>
          <p class="text-3xl font-bold text-purple-600">
            {{ testResults.latency }}ms
          </p>
        </div>
        <div class="md:col-span-3 bg-yellow-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-600 mb-1">抖动</p>
          <p class="text-xl font-bold text-yellow-600">
            {{ testResults.jitter }}ms
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
import { ref, onMounted, onUnmounted } from 'vue';

// 引入speedtest.js库
// @ts-ignore - 这个库没有TypeScript类型定义
const Speedtest = (window as any).Speedtest;

// 服务器选项 - 适配speedtest.js库的要求
interface Server {
  id: string;
  name: string;
  server: string;
  dlURL: string;
  ulURL: string;
  pingURL: string;
  getIpURL: string;
}

// 测试结果
interface TestResults {
  downloadSpeed: string;
  uploadSpeed: string;
  latency: string;
  jitter: string;
}

// 状态变量
const isTesting = ref(false);
const progress = ref(0);
const currentTestPhase = ref('');
const testResults = ref<TestResults | null>(null);
const lastTestTime = ref('暂无');
const clientIp = ref('');

// speedtest实例
let speedtestInstance: any = null;

// 服务器列表 - 更新为speedtest.js需要的格式
const servers = ref<Server[]>([
  {
    id: 'server1',
    name: '阿里云',
    server: 'https://librespeed.org/',
    dlURL: 'garbage.php',
    ulURL: 'empty.php',
    pingURL: 'empty.php',
    getIpURL: 'getIP.php'
  },
  {
    id: 'server2',
    name: '腾讯云',
    server: 'https://speedtest.mayhemiclabs.com/',
    dlURL: 'garbage.php',
    ulURL: 'empty.php',
    pingURL: 'empty.php',
    getIpURL: 'getIP.php'
  },
  {
    id: 'server3',
    name: '百度云',
    server: 'https://speedtest.wtnet.de/',
    dlURL: 'garbage.php',
    ulURL: 'empty.php',
    pingURL: 'empty.php',
    getIpURL: 'getIP.php'
  }
]);

const selectedServer = ref<Server>(servers.value[0]);

// 初始化speedtest实例
function initSpeedtest() {
  if (speedtestInstance) {
    try {
      if (speedtestInstance.getState() === 3) {
        speedtestInstance.abort();
      }
    } catch (e) {
      console.error('清理旧的测速实例失败:', e);
    }
  }
  
  // 创建新的speedtest实例
  speedtestInstance = new Speedtest();
  
  // 设置参数
  speedtestInstance.setParameter('telemetry_level', 0); // 禁用遥测
  speedtestInstance.setParameter('time_dl_max', 10); // 下载测试最大时长
  speedtestInstance.setParameter('time_ul_max', 10); // 上传测试最大时长
  
  // 设置回调函数
  speedtestInstance.onupdate = function(data: any) {
    // 更新进度和状态
    let totalProgress = 0;
    
    // 根据测试状态更新显示
    switch (data.testState) {
      case -1:
        currentTestPhase.value = '准备中...';
        break;
      case 0:
        currentTestPhase.value = '初始化测试...';
        break;
      case 1:
        currentTestPhase.value = '下载测试中...';
        totalProgress = data.dlProgress * 100;
        break;
      case 2:
        currentTestPhase.value = '延迟和抖动测试中...';
        totalProgress = 33 + data.pingProgress * 33;
        break;
      case 3:
        currentTestPhase.value = '上传测试中...';
        totalProgress = 66 + data.ulProgress * 33;
        break;
      case 4:
        currentTestPhase.value = '测试完成';
        totalProgress = 100;
        break;
      case 5:
        currentTestPhase.value = '测试已中止';
        break;
    }
    
    progress.value = Math.round(totalProgress);
    
    // 更新IP地址
    if (data.clientIp && data.clientIp !== '0.0.0.0') {
      clientIp.value = data.clientIp;
    }
  };
  
  speedtestInstance.onend = function(aborted: boolean) {
    // 测试结束处理
    if (!aborted) {
      // 更新上次测试时间
      const now = new Date();
      lastTestTime.value = now.toLocaleString();
      
      // 保存测试结果
      const lastData = JSON.parse(speedtestInstance._prevData);
      testResults.value = {
        downloadSpeed: lastData.dlStatus,
        uploadSpeed: lastData.ulStatus,
        latency: lastData.pingStatus,
        jitter: lastData.jitterStatus
      };
      
      // 显示完成状态
      setTimeout(() => {
        isTesting.value = false;
      }, 1000);
    } else {
      currentTestPhase.value = '测试已中止';
      isTesting.value = false;
    }
  };
}

// 选择服务器
const selectServer = (server: Server) => {
  selectedServer.value = server;
};

// 清除结果
const clearResults = () => {
  testResults.value = null;
  lastTestTime.value = '暂无';
  clientIp.value = '';
};

// 完整测速
const startFullTest = () => {
  if (isTesting.value) return;
  
  isTesting.value = true;
  progress.value = 0;
  currentTestPhase.value = '准备测速...';
  
  // 重新初始化speedtest实例
  initSpeedtest();
  
  // 设置服务器
  speedtestInstance.setSelectedServer(selectedServer.value);
  
  // 开始完整测试
  speedtestInstance.setParameter('test_order', 'IP_D_U_P');
  
  try {
    speedtestInstance.start();
  } catch (error) {
    console.error('测速启动失败:', error);
    isTesting.value = false;
    currentTestPhase.value = '测速启动失败，请重试';
  }
};

// 单独下载测速
const startDownloadTest = () => {
  if (isTesting.value) return;
  
  isTesting.value = true;
  progress.value = 0;
  currentTestPhase.value = '准备下载测速...';
  
  // 重新初始化speedtest实例
  initSpeedtest();
  
  // 设置服务器
  speedtestInstance.setSelectedServer(selectedServer.value);
  
  // 仅进行下载测试
  speedtestInstance.setParameter('test_order', 'I_D');
  
  try {
    speedtestInstance.start();
  } catch (error) {
    console.error('下载测速启动失败:', error);
    isTesting.value = false;
    currentTestPhase.value = '下载测速启动失败，请重试';
  }
};

// 单独上传测速
const startUploadTest = () => {
  if (isTesting.value) return;
  
  isTesting.value = true;
  progress.value = 0;
  currentTestPhase.value = '准备上传测速...';
  
  // 重新初始化speedtest实例
  initSpeedtest();
  
  // 设置服务器
  speedtestInstance.setSelectedServer(selectedServer.value);
  
  // 仅进行上传测试
  speedtestInstance.setParameter('test_order', 'I_U');
  
  try {
    speedtestInstance.start();
  } catch (error) {
    console.error('上传测速启动失败:', error);
    isTesting.value = false;
    currentTestPhase.value = '上传测速启动失败，请重试';
  }
};

// 组件挂载时的初始化
onMounted(() => {
  // 确保speedtest.js已加载
  if (typeof Speedtest !== 'function') {
    console.error('speedtest.js库未加载，请检查public目录下的文件');
    return;
  }
  
  // 初始化speedtest
  initSpeedtest();
});

// 组件卸载时清理
onUnmounted(() => {
  if (speedtestInstance) {
    try {
      if (speedtestInstance.getState() === 3) {
        speedtestInstance.abort();
      }
    } catch (e) {
      console.error('清理测速实例失败:', e);
    }
  }
});
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>