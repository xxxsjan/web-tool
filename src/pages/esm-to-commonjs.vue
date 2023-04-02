<template>
  <div class="wrapper">
    <h1>esm导入 和 commonjs导入语法的相互切换</h1>
    <codemirror
      class="left"
      v-model="code"
      placeholder="Code goes here..."
      :style="{ height: '300px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="handleState('change', $event)"
      @focus="handleState('focus', $event)"
      @blur="handleState('blur', $event)"
    />
    <div class="my-[10px] flex flex-col justify-center items-center">
      <el-card class="trans w-6/12">
        <div>
          <el-icon @click="changeMode"><i-ep-RefreshLeft /></el-icon>
          <span> 当前模式：生成{{ mode }} </span>
        </div>
        <div class="flex flex-row-reverse">
          <el-button @click="run">转换</el-button>
        </div>
      </el-card>
    </div>
    <!-- <codemirror
      class="right"
      v-model="code2"
      placeholder="Code goes here..."
      :style="{ height: '600px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
    /> -->
  </div>
  <resultDialog v-model="dialogVisible" :result="code2" />
</template>

<script setup>
// https://github.com/surmon-china/vue-codemirror
import { ref, onMounted, shallowRef } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
// import { oneDark } from '@codemirror/theme-one-dark';
const dialogVisible = ref(false);

const esmText = `import path from "path"
import Vue from 'vue';
import {cloneDeep} from "lodash-es"`;
const code2DefaultText = `请在左侧输入代码`;
const code = ref(esmText);
const code2 = ref(code2DefaultText);
const extensions = [
  javascript()
  // oneDark,
];
const mode = ref('commonjs');

function changeMode() {
  switch (mode.value) {
    case 'esm':
      mode.value = 'commonjs';
      code.value = esmText;
      code2.value = code2DefaultText;
      break;
    case 'commonjs':
      mode.value = 'esm';
      code.value = `const path = require("path")
const Vue = require('vue');
const {cloneDeep} = require("lodash-es");`;
      code2.value = code2DefaultText;
      break;
    default:
      break;
  }
}
// Codemirror EditorView instance ref
const view = shallowRef();
const handleReady = payload => {
  // https://codemirror.net/docs/ref/#view
  console.log('payload: ', payload);
  view.value = payload.view;
};

// Status is available at all times via Codemirror EditorView
const run = () => {
  // const state = view.value.state;
  // console.log('state: ', state);
  // const ranges = state.selection.ranges;
  // const selected = ranges.reduce((r, range) => r + range.to - range.from, 0);
  // const cursor = ranges[0].anchor;
  // const length = state.doc.length;
  // const lines = state.doc.lines;
  const code1Text = view.value.state.doc.text;
  console.log('code1Text: ', code1Text);
  if (mode.value === 'commonjs') {
    code2.value = code1Text
      .map(item => {
        let reg = /import\s+(.*?)\s+from\s+["']([\w-]+)["'];?/;
        const res = item.replace(reg, function (...args) {
          return `const ${args[1]} = require("${args[2]}");`;
        });
        return res;
      })
      .join('\n');
    console.log(code2.value);
  } else {
    code2.value = code1Text
      .map(item => {
        let reg = /const\s+(.*?)\s+=\s+require\(["']([\w-]+)["']\);?/;
        const res = item.replace(reg, function (...args) {
          return `import ${args[1]} from "${args[2]}";`;
        });
        return res;
      })
      .join('\n');
  }
  dialogVisible.value = true;
};
function handleState(state, e) {
  // log(state, e);
}
onMounted(() => {});
</script>
<style scoped>
.wrapper {
  /* display: grid; */

  /* width: 100vw; */

  /* height: 100%; */

  /* grid-template-columns: 1fr 150px 1fr; */

  /* grid-template-rows: 100%; */
}

.trans {
  /* display: flex; */

  /* justify-content: center; */

  /* align-items: center; */

  /* border: 1px solid #333; */

  /* flex-direction: column; */
}
</style>
