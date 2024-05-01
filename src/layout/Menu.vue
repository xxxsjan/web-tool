<template>
  <el-menu
    v-if="false"
    :default-active="activeIndex"
    class="el-menu-demo"
    mode="horizontal"
    router
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
  >
    <el-menu-item
      v-for="r in routes[0].children"
      :index="r.path"
      :key="r.name"
      >{{ r?.meta?.title || r.name }}</el-menu-item
    >
  </el-menu>
</template>

<script setup>
import routes from '@/router/routes';
const activeIndex = ref('vscode-snippet-generator');
</script>
