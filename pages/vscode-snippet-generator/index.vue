<script setup>
definePageMeta({
  tool: true,
  title: '⛏️vscode代码片段生成',
  group: '工具',
});

import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from 'vue';
import { useThemeStore } from '~/stores/theme';
import DemoChoose from './DemoChoose.vue';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less')
      return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor')
      return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  },
};

const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);

const inputEditor = ref(null);
const outputEditor = ref(null);
const inputContainer = ref(null);
const outputContainer = ref(null);
const language = ref('html');
const result = ref('');
const languages = [
  'css',
  'html',
  'javascript',
  'json',
  'less',
  'scss',
  'typescript',
];

const inputForm = reactive({
  prefix: '',
  description: '',
  snippetName: '',
});

const monacoTheme = computed(() => (isDark.value ? 'vs-dark' : 'vs'));

const commonConfig = computed(() => ({
  theme: monacoTheme.value,
  formatOnPaste: true,
  fontSize: 14,
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },
  roundedSelection: true,
}));

function onFormat(type) {
  const editor =
    type === 1 ? toRaw(inputEditor.value) : toRaw(outputEditor.value);
  editor?.getAction('editor.action.formatDocument')?.run();
}

function getEditValue() {
  const editor = toRaw(inputEditor.value);
  if (!editor) return [];
  return editor
    .getValue()
    .split(/\r?\n/)
    .map(line => line);
}

function onTransform() {
  const beforeBody = getEditValue();
  const prefix = inputForm.prefix || 'prefix';
  const description = inputForm.description || 'this is description';
  const keyName = inputForm.snippetName || 'default snippet name';
  const payload = {
    [keyName]: {
      prefix,
      body: beforeBody,
      description,
    },
  };
  result.value = JSON.stringify(payload);
  toRaw(outputEditor.value)?.setValue(result.value);
  onFormat(2);
}

async function copyResult() {
  const copyText = result.value.slice(1, -1) || '';
  if (!copyText) {
    ElMessage.warning('请先转换生成结果');
    return;
  }
  try {
    await navigator.clipboard.writeText(copyText);
    ElMessage.success('已复制片段内容');
  } catch {
    ElMessage.error('复制失败，请手动复制');
  }
}

watch(language, nVal => {
  const editor = toRaw(inputEditor.value);
  if (!editor) return;
  monaco.editor.setModelLanguage(editor.getModel(), nVal);
  onFormat(1);
});

watch(monacoTheme, theme => {
  monaco.editor.setTheme(theme);
});

const useCode = data => {
  inputForm.snippetName = data.snippetName;
  inputForm.prefix = data.prefix;
  inputForm.description = data.description;
  if (data.code) {
    toRaw(inputEditor.value)?.setValue(data.code);
    onFormat(1);
  }
};

onMounted(() => {
  if (inputContainer.value) {
    inputEditor.value = monaco.editor.create(inputContainer.value, {
      value: `<template>
  <div></div>
</template>
<script lang="ts" setup><\/script>
<style scoped><\/style>`,
      language: 'html',
      ...commonConfig.value,
    });
  }

  if (outputContainer.value) {
    outputEditor.value = monaco.editor.create(outputContainer.value, {
      value: '{\n  \n}',
      language: 'json',
      ...commonConfig.value,
    });
  }
});

onBeforeUnmount(() => {
  toRaw(inputEditor.value)?.dispose();
  toRaw(outputEditor.value)?.dispose();
});
</script>

<template>
  <div class="mx-auto w-full max-w-[1600px] px-3 pb-10 pt-2 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        VS Code 代码片段生成
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        粘贴代码 → 填写触发词 → 转换成 snippet JSON
      </p>
    </header>

    <div
      class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px_minmax(0,1fr)] xl:gap-5"
    >
      <!-- 输入 -->
      <section
        class="overflow-hidden rounded-2xl tool-panel"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-2 tool-panel-head px-3 py-2.5 sm:px-4"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-sm text-primary"
            >
              1
            </span>
            <div>
              <p class="text-sm font-medium text-base-content">源代码</p>
              <p class="text-[11px] text-base-content/45">编辑要做成片段的代码</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-model="language"
              class="select select-bordered select-sm w-auto min-w-[8.5rem]"
              aria-label="编辑器语言"
            >
              <option v-for="item in languages" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
            <button
              type="button"
              class="btn btn-ghost btn-sm border border-app-strong"
              @click="onFormat(1)"
            >
              格式化
            </button>
          </div>
        </div>
        <div
          ref="inputContainer"
          class="h-[min(62vh,560px)] w-full"
          :class="isDark ? 'bg-[#1e1e1e]' : 'bg-white'"
        />
      </section>

      <!-- 中间配置 -->
      <aside
        class="tool-panel flex flex-col gap-4 p-4 xl:self-start"
      >
        <div class="flex items-center gap-2">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-sm text-primary"
          >
            2
          </span>
          <div>
            <p class="text-sm font-medium text-base-content">片段信息</p>
            <p class="text-[11px] text-base-content/45">名称 · 触发词 · 描述</p>
          </div>
        </div>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs text-base-content/60">片段名称</span>
          </div>
          <input
            v-model="inputForm.snippetName"
            type="text"
            placeholder="例如 vue3-setup"
            class="input input-bordered input-sm w-full"
          />
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs text-base-content/60">触发指令 prefix</span>
          </div>
          <input
            v-model="inputForm.prefix"
            type="text"
            placeholder="例如 v3-setup"
            class="input input-bordered input-sm w-full"
          />
        </label>

        <label class="form-control w-full">
          <div class="label py-1">
            <span class="label-text text-xs text-base-content/60">描述 description</span>
          </div>
          <input
            v-model="inputForm.description"
            type="text"
            placeholder="简要说明用途"
            class="input input-bordered input-sm w-full"
          />
        </label>

        <div class="mt-1 flex flex-col gap-2">
          <button type="button" class="btn btn-primary btn-sm" @click="onTransform">
            转换为 Snippet
          </button>
          <DemoChoose @useCode="useCode" />
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-app-strong"
            @click="copyResult"
          >
            复制结果
          </button>
        </div>

        <p class="text-[11px] leading-relaxed text-base-content/40">
          复制结果会去掉最外层花括号，可直接粘贴进
          <code class="rounded bg-base-200 px-1">*.code-snippets</code>
        </p>
      </aside>

      <!-- 输出 -->
      <section
        class="overflow-hidden rounded-2xl tool-panel"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-2 tool-panel-head px-3 py-2.5 sm:px-4"
        >
          <div class="flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-sm text-success"
            >
              3
            </span>
            <div>
              <p class="text-sm font-medium text-base-content">Snippet JSON</p>
              <p class="text-[11px] text-base-content/45">生成后的代码片段</p>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm border border-app-strong"
            @click="onFormat(2)"
          >
            格式化
          </button>
        </div>
        <div
          ref="outputContainer"
          class="h-[min(62vh,560px)] w-full"
          :class="isDark ? 'bg-[#1e1e1e]' : 'bg-white'"
        />
      </section>
    </div>
  </div>
</template>
