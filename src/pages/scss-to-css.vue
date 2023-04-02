<template>
  <div class="less-to-css flex flex-col justify-center items-center">
    <h1>scss语法转css</h1>
    <el-input
      v-model="codeLeft"
      type="textarea"
      placeholder="Please input"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 50%"
      resize="none"
    />
    <div class="my-[10px]">
      <el-button @click="() => toGenerate()">生成</el-button>
    </div>
  </div>
  <resultDialog v-model="dialogVisible" :result="codeRight" />
</template>

<script setup lang="ts">
import less from "less";
const dialogVisible = ref(false);

const codeLeft = ref(`.header {
    width: 100px;
    @at-root &__button {
        background: red;
        
        @at-root &--primary {
            color: white;
        }
    }
}`);
const codeRight = ref("左侧输入后点击转换即可输出");
function toGenerate() {
  less.render(codeLeft.value, function (e, output) {
    if (!e && output!.css) {
      codeRight.value = output!.css;
      dialogVisible.value = true;
    } else {
      alert(e.message);
    }
  });
}
</script>
