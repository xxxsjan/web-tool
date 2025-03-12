<template>
  <div class="card bg-base-100 shadow-xl w-[700px]">
    <div class="card-body">
      <div class="card-title">驼峰转换</div>
      <div>
        <label>驼峰转换：</label>
        <input class="input" v-model="oriVal" style="width: 200px"></input>
      </div>

      <div class="flex justify-between">
        <button class="btn" @click="() => (resultVal = pascalToKebab(oriVal))">ToKebab</button>
        <button class="btn" @click="() => (resultVal = camelToKebab(oriVal))">ToKebab</button>
        <button class="btn" @click="() => (resultVal = kebabToPascal(oriVal))">ToPascal</button>
        <button class="btn" @click="() => (resultVal = kebabToCamel(oriVal))">ToCamel</button>
      </div>

      <div class="flex">
        <div class="mr-4">
          <span>结果：</span>
          <span>{{ resultVal }}</span>
        </div>
        <el-link v-show="resultVal" type="primary" @click="handleCopy">复制</el-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const oriVal = ref('PascalCase');
const resultVal = ref('');
function handleCopy() {
  try {
    navigator.clipboard.writeText(resultVal.value);
    ElMessage({
      message: '已复制',
      type: 'success',
    });
  } catch (error) {
    alert(error);
  }
}
function kebabToPascal(str: string) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
function pascalToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function kebabToCamel(str: string) {
  return str
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}
function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
</script>

<style scoped lang="scss"></style>
