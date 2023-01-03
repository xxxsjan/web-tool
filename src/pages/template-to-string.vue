<template>
  <div>
    <codemirror
      v-model="code"
      placeholder="Code goes here..."
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="handleReady"
      @change="handleState('change', $event)"
      @focus="handleState('focus', $event)"
      @blur="handleState('blur', $event)"
    />
    <el-button @click="getCodemirrorStates">获取state</el-button>
    <codemirror
      v-model="code2"
      placeholder="Code goes here..."
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
    />
  </div>
</template>

<script setup>
// https://github.com/surmon-china/vue-codemirror
import { ref, onMounted, shallowRef } from 'vue';
import { Codemirror } from 'vue-codemirror';
// import { javascript } from '@codemirror/lang-javascript';
// import { oneDark } from '@codemirror/theme-one-dark';
const code = ref(`\`
<div>
  <div>\${text}</div>
</div>
\``);
const code2 = ref(`console.log('Hello, world!')`);
const extensions = [
  // javascript(),
  // oneDark,
];

// Codemirror EditorView instance ref
const view = shallowRef();
const handleReady = (payload) => {
  // https://codemirror.net/docs/ref/#view
  console.log('payload: ', payload);
  view.value = payload.view;
};

// Status is available at all times via Codemirror EditorView
const getCodemirrorStates = () => {
  const state = view.value.state;
  const ranges = state.selection.ranges;
  const selected = ranges.reduce((r, range) => r + range.to - range.from, 0);
  const cursor = ranges[0].anchor;
  const length = state.doc.length;
  const lines = state.doc.lines;
  // more state info ...
  // return ...
  console.log(view.value.state.doc.text);
  code2.value = view.value.state.doc.text.reduce((pre, cur) => {
    let _cur = cur.replace('`', '');
    if (pre === '') {
      if (_cur.length > 0) {
        return `${handleStr(_cur)}`;
      } else {
        return pre;
      }
    } else {
      if (_cur.length > 0) {
        return `${pre}+\n${handleStr(_cur)}`;
      } else {
        return pre;
      }
    }
  }, '');
  function handleStr(str) {
    return (
      '"' +
      str.replaceAll(/\$\{(.*?)\}/g, (...args) => {
        // console.log(args);
        return `"+${args[1]}+"`;
      }) +
      '"'
    );
  }
};
const log = console.log;

function handleChange(e) {
  log('change', e);
}
function handleFocus(e) {
  log('focus', e);
}
function handleBlur(e) {
  log('blur', e);
}
function handleState(state, e) {
  // log(state, e);
}
onMounted(() => {});
</script>
<style scoped></style>
