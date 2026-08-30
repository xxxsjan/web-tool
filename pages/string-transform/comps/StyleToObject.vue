<script setup>
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { ElMessage } from 'element-plus';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new JsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

const inputEditor = ref(null);
const outputEditor = ref(null);
const language = ref('css');
const result = ref('');
const inputContainer = ref(null);
const outputContainer = ref(null);

function onFormat(type) {
  switch (type) {
    case 1:
      if (inputEditor.value) {
        inputEditor.value.getAction('editor.action.formatDocument').run();
      }
      break;
    case 2:
      if (outputEditor.value) {
        outputEditor.value.getAction('editor.action.formatDocument').run();
      }
      break;
    default:
      break;
  }
}

function onTransform() {
  const inputText = toRaw(inputEditor.value).getValue();
  const matches = inputText.match(/([a-zA-z\-]+):(.*?);/g);
  if (!matches) {
    ElMessage.warning('未识别到 CSS 声明');
    return;
  }
  const keyValue = matches
    .map((str) => {
      const key = str.split(':')[0];
      const value = str.split(':')[1].trim().replace(';', '');
      return `"${key}":"${value}"`;
    })
    .join(',');

  const _result = (result.value = `{${keyValue}}`);
  toRaw(outputEditor.value).setValue(_result);
  onFormat(2);
}

watch(
  () => language.value,
  (nVal) => {
    monaco.editor.setModelLanguage(toRaw(inputEditor.value).getModel(), nVal);
    onFormat(1);
  },
);

const commonConfig = {
  theme: 'vs-dark',
  formatOnPaste: true,
  fontSize: 14,
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

const copyResult = () => {
  const coptText = result.value.slice(1, -1) || '';
  if (coptText) {
    navigator.clipboard.writeText(coptText);
    ElMessage.success('复制成功');
  } else {
    ElMessage.warning('暂无结果可复制');
  }
};

function layoutEditors() {
  if (inputEditor.value && inputContainer.value) {
    toRaw(inputEditor.value).layout();
  }
  if (outputEditor.value && outputContainer.value) {
    toRaw(outputEditor.value).layout();
  }
}

onMounted(() => {
  if (inputContainer.value) {
    inputEditor.value = monaco.editor.create(inputContainer.value, {
      value: `.xxx{
        position: fixed;
        width: 300px;
        height: 300px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background-color: beige;
        display: flex;
        justify-content: center;
        align-items: center;
      }`,
      language: language.value,
      ...commonConfig,
    });
  }

  if (outputContainer.value) {
    outputEditor.value = monaco.editor.create(outputContainer.value, {
      value: JSON.stringify({}),
      language: 'json',
      ...commonConfig,
    });
  }

  setTimeout(() => {
    onFormat(1);
    layoutEditors();
  }, 300);

  window.addEventListener('resize', layoutEditors);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', layoutEditors);
  inputEditor.value?.dispose?.();
  outputEditor.value?.dispose?.();
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <label class="form-control w-full max-w-xs">
        <span class="mb-1 text-xs text-base-content/50">编辑器语言</span>
        <select v-model="language" class="select select-bordered select-sm w-full">
          <option
            v-for="item in ['css', 'html', 'javascript', 'json', 'less', 'scss', 'typescript']"
            :key="item"
            :value="item">
            {{ item }}
          </option>
        </select>
      </label>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-primary btn-sm" @click="onTransform">转换</button>
        <button class="btn btn-ghost btn-sm border border-base-300" @click="copyResult">
          复制结果
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="space-y-2">
        <p class="text-sm font-medium text-base-content">CSS 输入</p>
        <div
          ref="inputContainer"
          class="editor-pane h-[min(55vh,480px)] overflow-hidden rounded-xl border border-base-300/60" />
      </div>
      <div class="space-y-2">
        <p class="text-sm font-medium text-base-content">对象输出</p>
        <div
          ref="outputContainer"
          class="editor-pane h-[min(55vh,480px)] overflow-hidden rounded-xl border border-base-300/60" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-pane :deep(.monaco-editor),
.editor-pane :deep(.overflow-guard) {
  border-radius: 0.75rem;
}
</style>
