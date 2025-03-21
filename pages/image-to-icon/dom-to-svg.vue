<template>
  <div class="card w-[90vw] max-w-3xl bg-base-100 shadow-xl"> <!-- 响应式宽度 -->
    <div class="card-body space-y-6">
      <h2 class="card-title text-2xl text-gray-700">
        <i class="eva eva-code-download mr-2"></i>DOM转图片工具
      </h2>

      <!-- 输入区域 -->
      <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
        <div>输入HTML内容</div>
        <textarea v-model="domContent" class="textarea textarea-bordered h-48 font-mono text-sm w-full"
          placeholder="请输入要转换的HTML代码..."></textarea>
      </div>

      <!-- 预览区域 -->
      <div class="preview-container min-h-[200px] bg-white rounded-lg border-2 border-gray-200 p-4" ref="previewRef">
        <div v-if="!previewRef?.firstElementChild" class="text-gray-400 text-center py-10">
          <i class="eva eva-image-outline text-3xl block mb-2"></i>
          预览区域
        </div>
      </div>

      <!-- 操作按钮组 -->
      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <button @click="customToDo"
          class="btn btn-primary w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          :disabled="isLoading">
          <i class="eva eva-image" v-if="!isLoading"></i>
          <span class="loading loading-dots" v-else></span>
          {{ isLoading ? '转换中...' : '生成PNG图片' }}
        </button>

        <div class="divider sm:hidden">或</div>

        <a href="https://cdkm.com/cn/svg-to-jpg" target="_blank" class="btn btn-outline btn-info w-full sm:w-auto">
          <i class="eva eva-external-link mr-2"></i>
          在线SVG转JPG
        </a>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="alert alert-error shadow-lg">
        <i class="eva eva-alert-triangle"></i>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import domtoimage from 'dom-to-image';
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
const isLoading = ref(false); // 新增加载状态
const error = ref(''); // 新增错误状态

function customToDo() {
  if (!domContent.value) {
    error.value = '请输入HTML内容';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    previewRef.value.innerHTML = domContent.value;
    const firstDom = previewRef.value?.firstElementChild;

    if (!firstDom) {
      throw new Error('未检测到有效DOM元素');
    }

    domtoimage.toPng(firstDom)
      .then(dataUrl => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `dom-export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => {
        error.value = `转换失败: ${err.message}`;
      })
      .finally(() => {
        isLoading.value = false;
      });

  } catch (err) {
    error.value = err.message;
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* 新增加载动画 */
.loading-dots {
  --dot-size: 6px;
  width: calc(var(--dot-size) * 3 + 8px);
}

.loading-dots::after {
  content: '...';
  animation: dots 1.5s infinite steps(4);
}

@keyframes dots {
  25% {
    content: '.';
  }

  50% {
    content: '..';
  }

  75% {
    content: '...';
  }
}

.preview-container {
  min-height: 200px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-container img {
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  display: block;
}
</style>

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
