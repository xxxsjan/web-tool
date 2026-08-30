<template>
  <section
    class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm">
    <div class="border-b border-base-300/50 px-4 py-3 sm:px-5">
      <h2 class="text-sm font-semibold text-base-content sm:text-base">DOM 转 PNG</h2>
      <p class="mt-0.5 text-[11px] text-base-content/45 sm:text-xs">
        粘贴 HTML 片段，预览并导出为 PNG
      </p>
    </div>

    <div class="space-y-4 p-4 sm:p-5">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-base-content">HTML 内容</label>
        <textarea
          v-model="domContent"
          class="textarea textarea-bordered h-40 w-full font-mono text-sm leading-relaxed"
          placeholder="请输入要转换的 HTML 代码…"
          spellcheck="false" />
      </div>

      <div>
        <p class="mb-1.5 text-sm font-medium text-base-content">预览</p>
        <div
          ref="previewRef"
          class="preview-stage flex min-h-[160px] items-center justify-center overflow-auto rounded-xl border border-dashed border-base-300/70 p-4">
          <p
            v-if="!domContent.trim()"
            class="text-center text-xs text-base-content/40">
            输入 HTML 后点击生成
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          class="btn btn-primary btn-sm w-full sm:w-auto"
          :disabled="isLoading"
          @click="customToDo">
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          {{ isLoading ? '转换中…' : '生成 PNG' }}
        </button>

        <a
          href="https://cdkm.com/cn/svg-to-jpg"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm border border-base-300 w-full sm:w-auto">
          在线 SVG 转 JPG
        </a>
      </div>

      <div
        v-if="error"
        class="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
        {{ error }}
      </div>
    </div>
  </section>
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
        </div>`);
const previewRef = ref<HTMLElement>();
const isLoading = ref(false);
const error = ref('');

function customToDo() {
  if (!domContent.value) {
    error.value = '请输入 HTML 内容';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    previewRef.value!.innerHTML = domContent.value;
    const firstDom = previewRef.value?.firstElementChild;

    if (!firstDom) {
      throw new Error('未检测到有效 DOM 元素');
    }

    domtoimage
      .toPng(firstDom)
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
  } catch (err: any) {
    error.value = err.message;
    isLoading.value = false;
  }
}
</script>

<style scoped>
.preview-stage {
  background-color: color-mix(in oklab, var(--color-base-200) 70%, transparent);
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
