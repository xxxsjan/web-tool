<template>
  <div
    class="string-transform flex flex-col justify-center items-center gap-10"
  >
    <PathTransform id="PathTransform" />
    <HumpTransition id="HumpTransition" />
    <LessToCss id="LessToCss" />
    <EsmCommonjs id="EsmCommonjs" />

    <el-card class="quick-nav">
      <div class="quick-nav-item" v-for="item in list" :key="item">
        <a :href="`#${item}`">{{ comToName(item) }}</a>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import PathTransform from './comps/PathTransform.vue';
import HumpTransition from './comps/HumpTransition.vue';
import LessToCss from './comps/less-to-css.vue';
import EsmCommonjs from './comps/esm-to-commonjs.vue';

const list = ['PathTransform', 'HumpTransition', 'LessToCss', 'EsmCommonjs'];

function comToName(key: string) {
  return {
    PathTransform: 'windows路径转换',
    HumpTransition: '驼峰转换',
    LessToCss: 'LessToCss',
    EsmCommonjs: 'esm => commonjs'
  }[key];
}
</script>

<style>
.string-transform {
  scroll-behavior: smooth;
}
.quick-nav {
  width: 200px;
  max-height: 500px;
  position: fixed;
  right: 0;
  top: 20%;
  overflow: auto;
}

.quick-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: #ecf5ff;
  margin: 10px;
  color: #409eff;
}
</style>
