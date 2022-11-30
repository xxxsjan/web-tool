<template>
  <div>
    <el-menu
      :default-active="activeIndex"
      class="el-menu-demo"
      mode="horizontal"
      router
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
    >
      <el-menu-item index="vscode-snippet-generator">vscode用户代码片段</el-menu-item>
      <el-menu-item index="format-css-style">css style转对象</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const activeIndex = ref('vscode-snippet-generator');
</script>

<style scoped></style>
