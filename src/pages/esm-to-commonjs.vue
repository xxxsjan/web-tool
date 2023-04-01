<template>
  <div class="wrapper">
    <codemirror
      class="left"
      v-model="code"
      placeholder="Code goes here..."
      :style="{ height: '600px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="handleState('change', $event)"
      @focus="handleState('focus', $event)"
      @blur="handleState('blur', $event)"
    />
    <div class="trans">
      <el-button @click="run"
        >转换➡️{{ mode === 1 ? "commonjs" : "esm" }}</el-button
      >

      <el-button @click="changeMode">切换模式</el-button>
    </div>
    <codemirror
      class="right"
      v-model="code2"
      placeholder="Code goes here..."
      :style="{ height: '600px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
    />
  </div>
</template>

<script setup>
// https://github.com/surmon-china/vue-codemirror
import { ref, onMounted, shallowRef } from "vue";
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
// import { oneDark } from '@codemirror/theme-one-dark';
const code = ref(`import path from "path"
import Vue from 'vue';`);
const code2 = ref(`请在左侧输入esm代码`);
const extensions = [
  javascript(),
  // oneDark,
];
const mode = ref(1);

function changeMode() {
  if (mode.value === 1) {
    mode.value = 2;
    code.value = `const path = require("path")
const Vue = require('vue');`;
    code2.value = "请在左侧输入commonjs代码";
  } else {
    mode.value = 1;
    code.value = `import path from "path"
import Vue from 'vue';`;
    code2.value = "请在左侧输入esm代码";
  }
}
// Codemirror EditorView instance ref
const view = shallowRef();
const handleReady = (payload) => {
  // https://codemirror.net/docs/ref/#view
  console.log("payload: ", payload);
  view.value = payload.view;
};

// Status is available at all times via Codemirror EditorView
const run = () => {
  const state = view.value.state;
  const ranges = state.selection.ranges;
  const selected = ranges.reduce((r, range) => r + range.to - range.from, 0);
  const cursor = ranges[0].anchor;
  const length = state.doc.length;
  const lines = state.doc.lines;
  // more state info ...
  // return ...
  console.log(view.value.state.doc.text);
  const code1Text = view.value.state.doc.text;
  if (mode.value === 1) {
    code2.value = code1Text
      .map((item) => {
        let reg = /import\s+(\w+)\s+from\s+["'](\w+)["'];?/;
        const res = item.replace(reg, function (...args) {
          return `const ${args[1]} = require("${args[2]}");`;
        });
        return res;
      })
      .join("\n");
  } else {
    code2.value = code1Text
      .map((item) => {
        let reg = /const\s+(\w+)\s+=\s+require\(["'](\w+)["']\);?/;
        const res = item.replace(reg, function (...args) {
          return `import ${args[1]} = from "${args[2]}";`;
        });
        return res;
      })
      .join("\n");
  }
};
const log = console.log;

function handleChange(e) {
  log("change", e);
}
function handleFocus(e) {
  log("focus", e);
}
function handleBlur(e) {
  log("blur", e);
}
function handleState(state, e) {
  // log(state, e);
}
onMounted(() => {});
</script>
<style scoped>
.wrapper {
  display: grid;
  width: 100vw;
  height: 100%;
  grid-template-columns: 1fr 150px 1fr;
  grid-template-rows: 100%;
}

.trans {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #333;
  flex-direction: column;
}
</style>
