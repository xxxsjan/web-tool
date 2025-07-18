<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-center">抖音链接提取工具</h1>

    <div class="mb-4">
      <label
        for="inputText"
        class="block text-sm font-medium text-gray-700 mb-1"
        >输入文本</label
      >
      <textarea
        id="inputText"
        v-model="inputText"
        class="w-full p-3 border border-gray-300 rounded-md"
        rows="4"
        placeholder="请输入包含抖音链接的文本..."
      ></textarea>
    </div>

    <button
      @click="extractUrl"
      class="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
    >
      提取抖音链接
    </button>

    <div
      v-if="extractedUrl"
      class="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50"
    >
      <h2 class="text-lg font-semibold mb-2">提取结果</h2>
      <div class="flex items-center">
        <input
          type="text"
          v-model="extractedUrl"
          readonly
          class="flex-1 p-2 border border-gray-300 rounded-md"
        />
        <button
          @click="copyToClipboard"
          class="ml-2 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
        >
          {{ copyStatus }}
        </button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 p-3 bg-red-100 text-red-700 rounded-md"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const inputText = ref('');
const extractedUrl = ref('');
const errorMessage = ref('');
const copyStatus = ref('复制');

const extractUrl = async () => {
  // 清除之前的结果和错误信息
  extractedUrl.value = '';
  errorMessage.value = '';
  copyStatus.value = '复制';

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入文本内容';
    return;
  }

  const dyUrlRegex = /^.*?】(.+?)(https?:\/\/v\.douyin\.com\/[-\w]+\/)(.*)$/s;
  const matches = inputText.value.match(dyUrlRegex);
  console.log('matches: ', matches);

  if (matches) {
    const preLinkText = matches[1].trim(); // 链接前的文本
    const url = matches[2]; // 链接
    // const postLinkText = matches[3].trim(); // 链接后的文本（可选）

    if (!url) throw new Error('未找到抖音链接');
    const { data, error } = await useFetch('/api/test', {
      params: { url },
    });
    if (error.value) throw new Error(error.value.message || 'API请求失败');
    if (!data.value?.data?.url) throw new Error('无效的API响应格式');
    const res = data.value.data.url.split('?')[0];
    extractedUrl.value = `${preLinkText}${res} `;
  } else {
    errorMessage.value = '匹配错误';
  }
};

const copyToClipboard = async () => {
  if (!extractedUrl.value) return;

  try {
    await navigator.clipboard.writeText(extractedUrl.value);
    copyStatus.value = '已复制!';
    setTimeout(() => {
      copyStatus.value = '复制';
    }, 2000);
  } catch (err) {
    errorMessage.value = '复制失败，请手动复制';
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
