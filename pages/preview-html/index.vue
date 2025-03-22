<template>
  <div class="preview-html grid grid-rows-[auto_1fr] gap-6 h-[calc(100vh-64px)] p-6 bg-gray-50">
    <!-- 输入区域改为3列响应式布局 -->
    <div class="grid md:grid-cols-3 gap-6 min-h-[300px]">
      <div class="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
        <h2 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">HTML</h2>
        <textarea v-model="html"
          class="flex-1 w-full p-3 text-sm font-mono rounded border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="输入 HTML..." :autosize="{ minRows: 10, maxRows: 12 }"></textarea>
      </div>

      <!-- 类似修改 CSS 和 JavaScript 输入区域 -->
      <div class="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
        <h2 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">CSS</h2>
        <textarea
          class="flex-1 w-full p-3 text-sm font-mono rounded border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="style" placeholder="输入 CSS..." :autosize="{ minRows: 10, maxRows: 12 }"></textarea>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
        <h2 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">JavaScript</h2>
        <textarea
          class="flex-1 w-full p-3 text-sm font-mono rounded border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          v-model="script" placeholder="输入 JavaScript..." :autosize="{ minRows: 10, maxRows: 12 }"></textarea>
      </div>
    </div>

    <!-- 预览区域添加标题和阴影 -->
    <div class="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
      <h2 class="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">实时预览</h2>
      <iframe src="/iframe.html" class="w-full h-full rounded border border-gray-200 bg-white" frameborder="0"></iframe>
    </div>
  </div>
</template>

<script lang="ts" setup>
const html = ref(`<div class="triangle"></div>`);
const style = ref(`.triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 200px 200px 0 0;
  border-color: #007bff transparent transparent transparent;
  -webkit-filter: drop-shadow(1px 1px 1px rgba(0,0,0,.5));
  filter: drop-shadow(1px 1px 1px rgba(0,0,0,.5));
}`);
const script = ref('');

function setIframe(html: string, style: string, script: string) {
  const iframe = document.querySelector('iframe') as HTMLIFrameElement;
  const iframeDoc = iframe?.contentDocument || undefined;

  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(`<body> 
            <style>${style}<\/style>
            ${html}
            <script>${script}<\/script>
        <\/body>`);
    iframeDoc.close();
  }
}

watchEffect(() => {
  setIframe(html.value, style.value, script.value);
});

onMounted(() => {
  setIframe(html.value, style.value, script.value);
});
</script>

<style scoped></style>
