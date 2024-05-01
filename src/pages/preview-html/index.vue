<template>
  <div class="preview-html">
    <el-input
      v-model="html"
      type="textarea"
      placeholder="输入html"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 33%"
      resize="none"
    /><el-input
      v-model="style"
      type="textarea"
      placeholder="输入css样式"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 33%"
      resize="none"
    /><el-input
      v-model="script"
      type="textarea"
      placeholder="输入js脚本"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 33%"
      resize="none"
    />
    <el-card style="width: 100%" header="效果预览">
      <iframe src="/iframe.html" frameborder="0"></iframe>
    </el-card>
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

<style scoped>
iframe {
  width: 100%;
  min-height: 400px;
}
</style>
