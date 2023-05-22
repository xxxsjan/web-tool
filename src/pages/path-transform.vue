<template>
  <div>
    <el-card header="windows路径转换">
      <div class="less-to-css flex flex-col justify-center items-center">
        <el-input
          v-selectCopy
          v-model="originVal"
          type="textarea"
          placeholder="请输入windows的路径"
          :autosize="{ minRows: 3, maxRows: 15 }"
          style="width: 50%"
          resize="none"
        />
        <div class="my-[10px]">
          <el-button @click="toDo">生成</el-button>
        </div>
        <el-input
          v-show="result"
          v-model="result"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 15 }"
          style="width: 50%"
          resize="none"
          @focus="$event => $event.target.select()"
        />
      </div>
    </el-card>
    <el-card header="驼峰扎转换">
      <div>
        <label>驼峰扎转换：</label>
        <el-input v-model="oriVal" style="width: 200px"></el-input>
      </div>

      <el-button @click="() => (resultVal = pascalToKebab(oriVal))"
        >ToKebab</el-button
      >
      <el-button @click="() => (resultVal = camelToKebab(oriVal))"
        >ToKebab</el-button
      >
      <el-button @click="() => (resultVal = kebabToPascal(oriVal))"
        >ToPascal</el-button
      >
      <el-button @click="() => (resultVal = kebabToCamel(oriVal))"
        >ToCamel</el-button
      >

      <div>
        <label>结果：</label>
        <span>{{ resultVal }}</span>
        <el-link v-show="resultVal" type="primary" @click="handleCopy"
          >复制</el-link
        >
      </div>
    </el-card>
    <!-- <resultDialog v-model="dialogVisible" :result="result" /> -->
  </div>
</template>

<script>
const selectCopy = el => {
  console.log(el);
  if (el) {
    el.onfocus = function () {
      console.log('focus: ');
    };
  }
};
export default {
  name: 'path-transform',
  directives: { selectCopy }
};
</script>

<script setup>
// defineOptions({
//   name: 'path-transform'
// });
const oriVal = ref('PascalCase');
const resultVal = ref('');
function handleCopy() {
  try {
    navigator.clipboard.writeText(resultVal.value);
    ElMessage({
      message: '已复制',
      type: 'success'
    });
  } catch (error) {
    alert(error);
  }
}
function kebabToPascal(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
function pascalToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function kebabToCamel(str) {
  return str
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const dialogVisible = ref(false);
const originVal = ref(``);
const result = ref('');

function toDo() {
  console.log('result.value: ', result.value);
  if (!originVal.value) return;
  result.value = originVal.value.replace(/\\/g, '/');
  console.log('result.value: ', result.value);
  //   dialogVisible.value = true;
}
</script>
