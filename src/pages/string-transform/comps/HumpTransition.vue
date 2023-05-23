<template>
  <el-card header="驼峰转换" style="width: 700px">
    <div>
      <label>驼峰转换：</label>
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
</template>

<script lang="ts" setup>
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
