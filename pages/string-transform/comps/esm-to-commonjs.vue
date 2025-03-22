<template>
  <div class="">
    <div class="card bg-base-100 shadow-xl w-full">
      <div class="card-body">
        <div class="card-title">
          {{ mode === 'esm' ? 'esm转cjs' : 'cjs转esm' }}
        </div>

        <div class="flex flex-col justify-center items-center gap-4">
          <textarea v-model="code" class="textarea textarea-bordered w-full min-h-[200px]" placeholder="Bio"
            resize="none" rows="10"></textarea>
          <div class="w-1/2 flex justify-between items-center">
            <span @click="mode = mode === 'esm' ? 'commonjs' : 'esm'">切换</span>
            <button @click="run" class="btn btn-ghost">转换</button>
          </div>
        </div>
      </div>
    </div>
    <ResultDialog v-model="dialogVisible" :result="code2" />
  </div>
</template>

<script setup>
defineExpose({
  title: 'esm导入 和 commonjs导入语法的相互切换',
});
const dialogVisible = ref(false);

const esmText = `import path from "path"
import Vue from 'vue';
import {cloneDeep} from "lodash-es"
import json from "./package.json"
`;
const comText = `const path = require("path")
const Vue = require('vue');
const {cloneDeep} = require("lodash-es");
const json = require("./package.json");
`;
const code2DefaultText = `请在左侧输入代码`;

const code = ref(esmText);
const code2 = ref(code2DefaultText);
const mode = ref('esm');

watch(
  () => mode.value,
  value => {
    if (value !== 'esm') {
      code.value = comText;
      code2.value = code2DefaultText;
    } else {
      code.value = esmText;
      code2.value = code2DefaultText;
    }
  },
);

const run = () => {
  const code1Text = code.value.split('\n');
  if (mode.value === 'esm') {
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
