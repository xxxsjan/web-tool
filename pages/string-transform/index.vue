<template>
  <div class="string-transform pt-10 flex flex-col w-full items-center min-h-screen bg-gray-50">
    <!-- 新版导航标签 -->
    <div class="tabs tabs-lg mb-8 bg-white shadow-sm rounded-full p-1">
      <template v-for="item in list" :key="item">
        <button class="tab tab-bordered flex items-center gap-2 transition-all"
          :class="{ 'tab-active': curTab === item }" @click="curTab = item">
          <i :class="comToIcon(item)" class="text-lg"></i>
          {{ comToName(item) }}
        </button>
      </template>
    </div>

    <!-- 内容区域增加过渡动画 -->
    <Transition name="fade" mode="out-in">
      <div class="w-full max-w-4xl px-4" :key="curTab">
        <component :is="getComponent(curTab)" class="bg-white rounded-xl shadow-lg p-6" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import EsmCommonjs from './comps/esm-to-commonjs.vue';
import HumpTransition from './comps/HumpTransition.vue';
import PathTransform from './comps/PathTransform.vue';
import StyleToObject from './comps/StyleToObject.vue';
import TemplateToNormal from './comps/TemplateToNormal.vue';
import VueToJsx from './comps/VueToJsx.vue';

const list = ['PathTransform', 'HumpTransition', 'EsmCommonjs', 'StyleToObject', 'TemplateToNormal', 'VueToJsx'];
const curTab = ref('PathTransform');

// 新增图标映射
function comToIcon(key: string) {
  return {
    PathTransform: 'eva eva-folder',
    HumpTransition: 'eva eva-toggle-right',
    EsmCommonjs: 'eva eva-code',
    StyleToObject: 'eva eva-edit',
    TemplateToNormal: 'eva eva-file-text',
    VueToJsx: 'eva eva-file-code'
  }[key];
}

// 更新后的中文名称
function comToName(key: string) {
  return {
    PathTransform: '路径转换',
    HumpTransition: '驼峰转换',
    EsmCommonjs: '模块格式',
    StyleToObject: '样式对象',
    TemplateToNormal: '模板转换',
    VueToJsx: 'Vue转换'
  }[key];
}

// 新增组件动态加载
const componentMap = {
  EsmCommonjs,
  HumpTransition,
  PathTransform,
  StyleToObject,
  TemplateToNormal,
  VueToJsx
};
const getComponent = (name: string) => componentMap[name];
</script>

<style>
/* 新增过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 标签悬停效果 */
.tab:not(.tab-active):hover {
  @apply bg-blue-50 text-blue-600 scale-[1.02];
}
</style>
