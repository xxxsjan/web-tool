<template>
  <div class="string-transform">
    <el-card
      header="esm导入 和 commonjs导入语法的相互切换"
      style="width: 700px"
    >
      <el-input
        v-model="code"
        type="textarea"
        placeholder="Please input"
        :autosize="{ minRows: 10, maxRows: 15 }"
        style="width: 50%"
        resize="none"
      />

      <div class="my-[10px] flex flex-row justify-center items-center">
        <el-button @click="changeMode">
          <el-icon><i-ep-RefreshLeft /></el-icon>
          生成{{ mode }}</el-button
        >
        <el-button @click="run">转换</el-button>
      </div>
    </el-card>
    <resultDialog v-model="dialogVisible" :result="code2" />
  </div>
</template>

<script setup>
// https://github.com/surmon-china/vue-codemirror
import { defineExpose,ref } from 'vue';
defineExpose({
  title: 'esm导入 和 commonjs导入语法的相互切换'
});
const dialogVisible = ref(false);
const esmText = `import path from "path"
import Vue from 'vue';
import {cloneDeep} from "lodash-es"
import json from "./package.json"
`;
const code2DefaultText = `请在左侧输入代码`;
const code = ref(esmText);
const code2 = ref(code2DefaultText);
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
const {cloneDeep} = require("lodash-es");
const json = require("./package.json");
`;
      code2.value = code2DefaultText;
      break;
    default:
      break;
  }
}

const run = () => {
  const code1Text = code.value.split('\n');
  if (mode.value === 'commonjs') {
    code2.value = code1Text
      .map(item => {
        let reg = /import\s+(.*?)\s+from\s+["'`]([\w-\/.]+)["'`];?/;
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
        let reg = /const\s+(.*?)\s+=\s+require\(["'`]([\w-\/.]+)["'`]\);?/;
        const res = item.replace(reg, function (...args) {
          return `import ${args[1]} from "${args[2]}";`;
        });
        return res;
      })
      .join('\n');
  }
  dialogVisible.value = true;
};
</script>
