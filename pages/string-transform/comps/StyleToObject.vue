<script setup>
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
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
const language = ref('css');
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
  console.log('原文本', toRaw(inputEditor.value).getValue());
  toRaw(inputEditor.value)
    .getValue()
    .split('')
    // 根据 \n 算换行
    .map((item, index) => {
      if (item !== '\n') {
        str += item;
      } else {
        arr.push(str);
        str = '';
      }
    });
  //   console.log('getEditValue', arr);
  return arr;
}
function onTransform() {
  const inputText = toRaw(inputEditor.value).getValue();
  console.log('inputText: ', inputText);
  const reg = /([a-zA-z\-]+):(.*?);/g;
  const keyValue = inputText
    .match(reg)
    .map(str => {
      const key = str.split(':')[0],
        value = str.split(':')[1].trim().replace(';', '');
      return `"${key}":"${value}"`;
    })
    .join(',');

  const _result = (result.value = `{${keyValue}}`);
  toRaw(outputEditor.value).setValue(_result);
  onFormat(2);
}
watch(
  () => language.value,
  nVal => {
    console.log('nVal: ', nVal);
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
  fontSize: 16,
  minimap: {
    enabled: false,
  },
};

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

  if (outputContainerDom) {
    outputEditor.value = monaco.editor.create(outputContainerDom, {
      value: JSON.stringify({}),
      language: 'json',
      ...commonConfig,
    });
  }
  setTimeout(() => {
    onFormat(1);
  }, 1111);
  window.addEventListener('resize', () => {
    const editor1 = document.querySelector(
      '#inputContainer .monaco-editor.vs-dark',
    );
    const editor2 = document.querySelector(
      '#outputContainer .monaco-editor.vs-dark',
    );
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
  <div class="card bg-base-100 shadow-sm p-2 grid w-[70vw]  max-w-[1800px] h-full grid-cols-[1fr_120px_1fr]">
    <div class="left">
      <div id="inputContainer" ref="inputContainer" style="height: 70vh"></div>
      <div class="m-2">
        <label class="form-control">
          <div class="label">
            <span class="label-text"> 选择编辑器语言</span>
            <span class="label-text-alt"></span>
          </div>
          <select class="select select-bordered w-full max-w-xs" v-model="language">
            <option v-for="item in [
            'css',
            'html',
            'javascript',
            'json',
            'less',
            'scss',
            'typescript',
          ]" :key="item" :label="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
      </div>
    </div>
    <div class="center h-full flex flex-col justify-center gap-4 px-2">
      <button class="btn btn-primary" @click="onTransform">转换</button>
      <button class="btn" @click="copyResult">复制结果</button>
    </div>

    <div class="right">
      <div id="outputContainer" ref="outputContainer" style="height: 70vh"></div>
    </div>
  </div>
</template>

<style scoped>
.left {
  overflow: hidden;
}

.right {
  overflow: hidden;
}

.xxx {
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
  background-color: beige;
  transform: translate(-50%, -50%);

  /* position: 'fixed',
          width: '300px',
          height: '300px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          'background-color': 'beige',
          display: 'flex',
          'justify-content': 'center',
          'align-items': 'center', */
}
</style>
