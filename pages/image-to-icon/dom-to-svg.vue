<template>
  <div class="card w-[700px] bg-base-100 shadow-xl">
    <div class="card-body">
      <div class="bg-[#cccccc] flex flex-col gap-4 items-center p-4">

        <div class="w-full max-w-[600px]">
          <textarea v-model="domContent" class="w-full min-h-[200px] p-2 rounded" placeholder="请输入HTML内容"></textarea>
        </div>

        <div class="preview-container" ref="previewRef"></div>

        <div class="flex gap-4 items-center">
          <button @click="customToDo" class="btn">DOM转图片</button>
          <a href="https://cdkm.com/cn/svg-to-jpg" target="_blank" class="link">在线SVG转JPG</a>
        </div>
      </div>

    </div>
  </div>

</template>

<script lang="ts" setup>
import domtoimage from 'dom-to-image';
import { elementToSVG, inlineResources } from 'dom-to-svg';
const result = ref('');
const domContent = ref(`<div class="addPost">
          <div class="addPost-main">
            <div class="addPost-i">
              <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728="">
                <path fill="currentColor"
                  d="M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64h352z">
                </path>
              </svg>
            </div>
          </div>
        </div>`)
const previewRef = ref<HTMLElement>();

function customToDo() {
  if (!domContent.value) return;

  previewRef.value.innerHTML = domContent.value;
  // 获取预览容器中的第一个DOM元素
  const firstDom = previewRef.value?.firstElementChild;
  if (!firstDom) return;
  // 转换为图片
  domtoimage.toPng(firstDom)
    .then(function (dataUrl) {
      // 下载图片
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'custom-dom.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(function (error) {
      console.error('转换失败:', error);
    });
}

</script>

<style>
.addPost {
  width: 200px;
  height: 200px;
  padding: 0;
  position: relative;
  overflow: initial;
}

.addPost .addPost-main {
  position: absolute;
  background-color: #fff;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: solid 8px #f9f9f9;
  box-sizing: border-box;
}

.addPost-i {
  background-color: #abfbeb;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  line-height: 200px;
  text-align: center;
  font-size: 140px;
  color: #fff;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
}

.addPost-i svg {
  width: 105px;
}
</style>
