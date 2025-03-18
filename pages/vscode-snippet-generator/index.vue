<script setup>
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { onMounted, ref, toRaw, watch } from 'vue';
import DemoChoose from './DemoChoose.vue';

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
const language = ref('html');
const result = ref('');

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
function getEditValue() {
  // https://www.jianshu.com/p/316cd6f5b54a?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation
  const arr = [];
  let str = '';
  console.log('input', toRaw(inputEditor.value).getValue());
  toRaw(inputEditor.value)
    .getValue()
    .split('')
    .map((item, index, oArr) => {
      if (item !== '\n') {
        str += item;
      } else {
        arr.push(str);
        str = '';
      }
      if (str && index === oArr.length - 1) {
        arr.push(str);
      }
    });
  console.log('output', arr);
  return arr;
}
function onTransform() {
  const beforeBody = getEditValue();

  const prefix = inputForm.prefix || 'prefix';
  const description = inputForm.description || 'this is description';
  const keyName = inputForm.snippetName || 'default snippet name';
  const _result = (result.value = JSON.stringify({
    [keyName]: {
      prefix,
      body: beforeBody,
      description,
    },
  }));
  toRaw(outputEditor.value).setValue(_result);
  onFormat(2);
}
watch(
  () => language.value,
  nVal => {
    console.log('language: ', nVal);
    monaco.editor.setModelLanguage(toRaw(inputEditor.value).getModel(), nVal);
    // toRaw(inputEditor.value).updateOptions({
    //   language: nVal,
    // });
    onFormat(1);
  },
);
const commonConfig = {
  theme: 'vs-dark',
  formatOnPaste: true, // 粘贴时格式化
  fontSize: 14,
  minimap: {
    enabled: false,
  },
};
const inputForm = reactive({ prefix: '', description: '', snippetName: '' });
const copyResult = () => {
  const coptText = result.value.slice(1, -1) || '';
  console.log('coptText: ', coptText);
  if (coptText) {
    navigator.clipboard.writeText(coptText);
    ElMessage.success('复制成功');
  }
};

onMounted(() => {
  const inputContainerDom = document.querySelector('#inputContainer');
  const outputContainerDom = document.querySelector('#outputContainer');
  if (inputContainerDom) {
    inputEditor.value = monaco.editor.create(inputContainerDom, {
      value: `<template>
        <div><\/div>
<\/template>
<script lang="ts" setup><\/script>
<style scoped><\/style>`,
      language: 'html',
      ...commonConfig,
    });
  }

  if (outputContainerDom) {
    outputEditor.value = monaco.editor.create(outputContainerDom, {
      value: JSON.stringify({}),
      language: 'json',
      ...commonConfig,
    });
  }

  window.addEventListener('resize', () => {
    const editor1 = document.querySelector(
      '#inputContainer .monaco-editor.vs-dark',
    );
    // const editor2 = document.querySelector(
    //   '#outputContainer .monaco-editor.vs-dark'
    // );
    toRaw(inputEditor.value).layout({
      width: editor1.parentElement.offsetWidth,
      height: editor1.parentElement.offsetHeight,
    });
    toRaw(outputEditor.value).layout({
      width: editor1.parentElement.offsetWidth,
      height: editor1.parentElement.offsetHeight,
    });
  });
});

const useCode = data => {
  console.log('data: ', data);
  inputForm.snippetName = data.snippetName;
  inputForm.prefix = data.prefix;
  inputForm.description = data.description;

  if (data.code) {
    toRaw(inputEditor.value).setValue(data.code);
    onFormat(1);
  }
};
</script>

<template>
  <div class="w-full h-full grid grid-cols-[1fr_300px_1fr]">
    <div class="left">
      <div id="inputContainer" ref="inputContainer" style="max-width: 100%; height: 80vh"></div>
    </div>
    <div class="flex flex-col items-center justify-center">
      <div class="flex flex-col gap-5">
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">snippet name</span>
          </div>
          <input v-model="inputForm.snippetName" type="text" placeholder="输入片段名称"
            class="input input-bordered w-full max-w-xs" />
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">prefix</span>
          </div>
          <input v-model="inputForm.prefix" type="text" placeholder="输入触发指令"
            class="input input-bordered w-full max-w-xs" />
        </label>
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">description</span>
          </div>
          <input v-model="inputForm.description" type="text" placeholder="输入描述"
            class="input input-bordered w-full max-w-xs" />
        </label>
        <button @click="onTransform" class="btn">转换</button>
        <DemoChoose @useCode="useCode" />
        <button @click="copyResult" class="btn">复制结果</button>
      </div>
    </div>

    <div class="right">
      <div id="outputContainer" ref="outputContainer" style="max-width: 100%; height: 80vh"></div>
    </div>
  </div>
  <div class="m-4">
    选择编辑器语言
    <select v-model="language" placeholder="language" size="default" class="select select-bordered">
      <option v-for="item in [
            'css',
            'html',
            'javascript',
            'json',
            'less',
            'scss',
            'typescript',
          ]" :key="item" :label="item" :value="item">{{ item }}</option>
    </select>
  </div>
</template>
