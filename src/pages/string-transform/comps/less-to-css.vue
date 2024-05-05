<template>
  <div class="card bg-base-100 shadow-xl w-[700px]">
    <div class="card-body">
      <div class="card-title">less语法转css</div>
      <div class="less-to-css flex flex-col justify-center items-center gap-4">
        <AutoTextarea v-model="codeLeft" />

        <el-button @click="() => toGenerate()">生成</el-button>
      </div>
    </div>
    <resultDialog v-model="dialogVisible" :result="codeRight" />
  </div>
</template>

<script setup lang="ts">
import less from 'less';

const dialogVisible = ref(false);

const codeLeft = ref(`@color: #f00;
  .header {
    background-color: @color;
  }
  
  .button {
    color: @color;
  }
`);
const codeRight = ref('左侧输入后点击转换即可输出');
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
