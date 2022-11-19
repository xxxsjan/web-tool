<script setup>
import { onMounted, ref, watch, toRaw } from 'vue';
import * as monaco from 'monaco-editor';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

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
  console.log(toRaw(inputEditor.value));
  toRaw(inputEditor.value)
    .getValue()
    .split('')
    .map((item, index) => {
      if (item !== '\n') {
        str += item;
      } else {
        arr.push(str);
        str = '';
      }
    });
  console.log(arr);
  return arr;
}
function onTransform() {
  const beforeBody = getEditValue();
  console.log('onTransform: ');
  const prefix = inputForm.value.prefix || 'undefined prefix';
  const description = inputForm.value.description || 'undefined description';
  const keyName = 'Print to xxxxxxxxxxxxxxxxxx';
  toRaw(outputEditor.value).setValue(
    JSON.stringify({
      [keyName]: {
        prefix,
        body: beforeBody,
        description,
      },
    })
  );
  onFormat(2);
}
watch(
  () => language.value,
  (nVal) => {
    console.log('nVal: ', nVal);
    monaco.editor.setModelLanguage(toRaw(inputEditor.value).getModel(), nVal);
    // toRaw(inputEditor.value).updateOptions({
    //   language: nVal,
    // });
    onFormat(1);
  }
);
const commonConfig = {
  theme: 'vs-dark',
  formatOnPaste: true, // 粘贴时格式化
  fontSize: 16,
  minimap: {
    enabled: false,
  },
};
const inputForm = ref({});
onMounted(() => {
  const inputContainerDom = document.querySelector('#inputContainer');
  const outputContainerDom = document.querySelector('#outputContainer');
  if (inputContainerDom) {
    inputEditor.value = monaco.editor.create(inputContainerDom, {
      value: `<template>
    <div><\/div>
</template>
<script lang="ts" setup><\/script>
<style scoped><\/style>`,
      language: 'html',
      ...commonConfig,
    });
  }

  if (outputContainerDom) {
    outputEditor.value = monaco.editor.create(outputContainerDom, {
      value: '',
      language: 'json',
      ...commonConfig,
    });
  }

  // window.addEventListener('resize', () => {
  //   document.querySelectorAll('.monaco-editor.vs-dark').forEach((editor) => {
  //     editor.style.width = editor.parentElement.offsetWidth + 'px';
  //     const scrollbar = editor.querySelector(',decorationsOverviewRuler');
  //     console.log('scrollbar: ', scrollbar);
  //   });
  // });
});
</script>

<template>
  <div class="wrapper">
    <div>
      <div id="inputContainer" ref="inputContainer" style="height: 80vh; max-width: 100%" />
      <div class="m-10">
        选择编辑器语言
        <el-select v-model="language" placeholder="language" size="default">
          <el-option
            v-for="item in [
              'css',
              'html',
              'javascript',
              'json',
              'less',
              'markdown',
              'mysql',
              'scss',
              'shell',
              'sql',
              'typescript',
              'xml',
            ]"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>
    </div>
    <div class="trans" @click="onTransform">
      <el-form :model="inputForm" label-width="120px">
        <el-form-item label="prefix">
          <el-input v-model="inputForm.prefix" />
        </el-form-item>
        <el-form-item label="description">
          <el-input v-model="inputForm.description" />
        </el-form-item>
        <el-form-item>
          <el-button @click="onTransform" type="primary"> 转换</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div>
      <div id="outputContainer" ref="outputContainer" style="height: 80vh; max-width: 100%" />
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 333px 1fr;
  grid-template-rows: 1fr;
}
.trans {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
