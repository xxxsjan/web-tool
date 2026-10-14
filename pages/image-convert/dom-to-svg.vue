<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1.5 block text-sm font-medium text-base-content">HTML 内容</label>
      <textarea v-model="domContent" class="textarea textarea-bordered h-40 w-full font-mono text-sm leading-relaxed"
        placeholder="请输入要转换的 HTML 代码…" spellcheck="false" @keydown.ctrl.enter.prevent="generatePng"
        @keydown.meta.enter.prevent="generatePng" />
    </div>

    <div>
      <p class="mb-1.5 text-sm font-medium text-base-content">预览</p>
      <div class="preview-stage flex min-h-[160px] items-center justify-center overflow-auto rounded-xl border border-dashed border-app-strong p-4">
        <p v-if="!canGenerate" class="text-center text-xs text-base-content/40">
          输入 HTML 后在此实时预览
        </p>
        <div v-else ref="previewRef" />
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" class="btn btn-primary btn-sm w-full sm:w-auto" :disabled="isLoading || !canGenerate"
        @click="generatePng">
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        {{ isLoading ? '转换中…' : '生成 PNG' }}
      </button>

      <a href="https://cdkm.com/cn/svg-to-jpg" target="_blank" rel="noopener noreferrer"
        class="btn btn-ghost btn-sm border border-app-strong w-full sm:w-auto">
        在线 SVG 转 JPG
      </a>
    </div>

    <div v-if="error" class="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
      {{ error }}
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
        </div>`);
const previewRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const error = ref('');

/** 统一入口校验：与模板空状态判断保持一致（trim） */
const canGenerate = computed(() => domContent.value.trim().length > 0);

/** 实时预览防抖定时器 */
let previewTimer: ReturnType<typeof setTimeout> | undefined;
/** 转换任务标记：保证只有最后一次触发生效 */
let convertToken = 0;

/** 将输入内容渲染到预览节点（该节点无 Vue 子节点，innerHTML 安全） */
function renderPreview() {
  const stage = previewRef.value;
  if (!stage || isLoading.value) return;
  stage.innerHTML = domContent.value;
}

watch(domContent, () => {
  error.value = '';
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(renderPreview, 150);
});

onMounted(() => {
  renderPreview();
});

onBeforeUnmount(() => {
  if (previewTimer) clearTimeout(previewTimer);
});

function download(dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `dom-export-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function generatePng() {
  if (!canGenerate.value) {
    error.value = '请输入 HTML 内容';
    return;
  }
  if (isLoading.value) return;

  // 先同步预览，确保截取的是最新输入；此时不能被 isLoading 拦截
  if (previewTimer) clearTimeout(previewTimer);
  renderPreview();

  const stage = previewRef.value;
  if (!stage || !stage.children.length) {
    error.value = '未检测到有效 DOM 元素';
    return;
  }

  const token = ++convertToken;
  isLoading.value = true;
  error.value = '';

  const elements = Array.from(stage.children) as HTMLElement[];

  // 多个根元素时临时包裹，避免只截取第一个而丢内容
  let wrapper: HTMLElement | null = null;
  let target: HTMLElement;
  if (elements.length === 1) {
    target = elements[0];
  } else {
    wrapper = document.createElement('div');
    stage.insertBefore(wrapper, elements[0]);
    for (const el of elements) wrapper.appendChild(el);
    target = wrapper;
  }

  try {
    const dataUrl = await domtoimage.toPng(target);
    if (token === convertToken) download(dataUrl);
  } catch (err) {
    if (token === convertToken) {
      error.value = `转换失败: ${err instanceof Error ? err.message : String(err)}`;
    }
  } finally {
    if (token === convertToken) isLoading.value = false;
    // 结束后同步一次预览：清除临时包裹，并补上转换期间被拦截的输入更新
    renderPreview();
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
