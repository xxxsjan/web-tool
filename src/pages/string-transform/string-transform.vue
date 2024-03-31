<template>
  <div
    class="string-transform flex flex-col justify-center items-center gap-10"
  >
    <PathTransform id="PathTransform" />
    <HumpTransition id="HumpTransition" />
    <LessToCss id="LessToCss" />
    <EsmCommonjs id="EsmCommonjs" />

    <el-card
      class="quick-nav fixed top-2 overflow-auto max-w-max max-h-[500px]"
    >
      <div class="flex gap-1">
        <div
          class="quick-nav-item m-1 rounded h-7 px-2"
          v-for="item in list"
          :key="item"
        >
          <a :href="`#${item}`">{{ comToName(item) }}</a>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import EsmCommonjs from './comps/esm-to-commonjs.vue';
import HumpTransition from './comps/HumpTransition.vue';
import LessToCss from './comps/less-to-css.vue';
import PathTransform from './comps/PathTransform.vue';

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

.quick-nav-item {
  display: flex;
  align-items: center;
  background: #ecf5ff;
  color: #409eff;
}
</style>
