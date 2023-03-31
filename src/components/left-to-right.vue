<template>
  <div class="wrapper">
    <div class="left">
      <codemirror
        v-model="code"
        placeholder="Code goes here..."
        :style="{ height: '600px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        @ready="handleReady"
        autoDestroy
      />
    </div>

    <div class="center">
      <slot></slot>
      <div><el-button @click="handleGenerate">转换➡️</el-button></div>
    </div>
    <div class="right">
      <codemirror
        v-model="code2"
        placeholder="Code goes here..."
        :style="{ height: '600px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        lineWrapping
        autoDestroy
      />
    </div>
  </div>
</template>

<script setup>
// https://github.com/surmon-china/vue-codemirror
// import { ref, onMounted, shallowRef } from "vue";
import { Codemirror } from "vue-codemirror";
import { css } from "@codemirror/lang-css";

const props = defineProps(["codeLeft", "codeRight"]);
const emits = defineEmits([
  "update:codeLeft",
  "update:codeRight",
  "toGenerate",
]);
const code = ref(props.codeLeft);
const code2 = ref(props.codeRight);

watchEffect(() => {
  emits("update:codeLeft", code.value);
});
watch(
  () => code2.value,
  () => {
    emits("update:codeRight", code2.value);
  }
);
watch(
  () => props.codeRight,
  (newValue, oldValue) => {
    if (newValue !== code2.value) {
      code2.value = newValue;
    }
  }
);

const extensions = [css()];

// Codemirror EditorView instance ref
const view = shallowRef();
const handleReady = (payload) => {
  // https://codemirror.net/docs/ref/#view
  console.log("payload: ", payload);
  view.value = payload.view;
};

// Status is available at all times via Codemirror EditorView
const handleGenerate = () => {
  // const state = view.value.state;
  // const ranges = state.selection.ranges;
  // const selected = ranges.reduce((r, range) => r + range.to - range.from, 0);
  // const cursor = ranges[0].anchor;
  // const length = state.doc.length;
  // const lines = state.doc.lines;
  // console.log(view.value.state.doc.text);
  emits("toGenerate", code.value);
};
</script>
<style scoped>
.wrapper {
  width: 100vw;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 100px 1fr;
  grid-template-rows: 100%;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #333;
  flex-direction: column;
}
</style>
