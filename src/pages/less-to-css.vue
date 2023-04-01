<template>
  <LeftToRight
    v-model:codeLeft="codeLeft"
    v-model:codeRight="codeRight"
    @toGenerate="toGenerate"
  />
</template>

<script setup lang="ts">
// import LeftToRight from "../components/left-to-right.vue";
import less from "less";

const codeLeft = ref(`@color: #f00;
  .header {
    background-color: @color;
  }
  
  .button {
    color: @color;
  }
  `);
const codeRight = ref("左侧输入后点击转换即可输出");
function toGenerate() {
  less.render(codeLeft.value, function (e, output) {
    if (!e && output!.css) {
      codeRight.value = output!.css;
      console.log(
        "🚀 ~ file: less-to-css.vue:27 ~ codeRight.value:",
        codeRight.value
      );
    } else {
      alert(e.message);
    }
  });
}
</script>
