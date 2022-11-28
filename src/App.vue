<script setup>
import { onMounted, ref, watch, toRaw, getCurrentInstance } from 'vue';
import * as monaco from 'monaco-editor';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
console.log(getCurrentInstance());
const glp = getCurrentInstance().appContext.config.globalProperties;
console.log('glp: ', glp);
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
  const prefix = inputForm.value.prefix || 'prefix';
  const description = inputForm.value.description || 'this is description';
  const keyName = inputForm.value.snippetName || 'default snippet name';
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
const copyResult = () => {
  const coptText = result.value.slice(1, -1) || '';
  console.log('coptText: ', coptText);
  if (coptText) {
    navigator.clipboard.writeText(coptText);
    glp.$message.success('复制成功');
  }
};
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
      value: JSON.stringify({}),
      language: 'json',
      ...commonConfig,
    });
  }

  window.addEventListener('resize', () => {
    const editor1 = document.querySelector('#inputContainer .monaco-editor.vs-dark');
    const editor2 = document.querySelector('#outputContainer .monaco-editor.vs-dark');
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
</script>

<template>
  <div class="wrapper">
    <div class="left">
      <div id="inputContainer" ref="inputContainer" style="height: 80vh; max-width: 100%" />
      <div class="m-10">
        选择编辑器语言
        <el-select v-model="language" placeholder="language" size="default">
          <el-option
            v-for="item in ['css', 'html', 'javascript', 'json', 'less', 'scss', 'typescript']"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </div>
    </div>
    <div class="trans" @click="onTransform">
      <el-form :model="inputForm" label-width="120px">
        <el-form-item label="snippet name">
          <el-input v-model="inputForm.snippetName" placeholder="输入片段名称" />
        </el-form-item>
        <el-form-item label="prefix">
          <el-input v-model="inputForm.prefix" placeholder="输入触发指令" />
        </el-form-item>
        <el-form-item label="description">
          <el-input v-model="inputForm.description" placeholder="输入描述" />
        </el-form-item>
        <el-form-item>
          <el-button @click="onTransform" type="primary"> 转换</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="right">
      <div id="outputContainer" ref="outputContainer" style="height: 80vh; max-width: 100%" />
      <el-button @click="copyResult">复制结果</el-button>
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 333px 1fr;
  grid-template-rows: 100%;
}
.left {
  overflow: hidden;
}
.right {
  overflow: hidden;
}
.trans {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
