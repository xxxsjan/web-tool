<template>
  <div class="string-transform pt-10 flex flex-col w-full justify-center items-center">

    <div class="tabs tabs-box mb-2">
      <input type="radio" name="my_tabs_1" class="tab" :aria-label="comToName(item)" v-for="item in list" :key="item"
        :checked="curTab === item" @click="curTab = item" />
    </div>
    <PathTransform id="PathTransform" v-if="curTab === 'PathTransform'" />
    <HumpTransition id="HumpTransition" v-if="curTab === 'HumpTransition'" />
    <LessToCss id="LessToCss" v-if="curTab === 'LessToCss'" />
    <EsmCommonjs id="EsmCommonjs" v-if="curTab === 'EsmCommonjs'" />


    <StyleToObject id="StyleToObject" v-if="curTab === 'StyleToObject'" />
    <TemplateToNormal id="TemplateToNormal" v-if="curTab === 'TemplateToNormal'" />
    <VueToJsx id="VueToJsx" v-if="curTab === 'VueToJsx'" />
  </div>
</template>

<script lang="ts" setup>
import EsmCommonjs from './comps/esm-to-commonjs.vue';
import HumpTransition from './comps/HumpTransition.vue';
import LessToCss from './comps/less-to-css.vue';
import PathTransform from './comps/PathTransform.vue';
import StyleToObject from './comps/StyleToObject.vue';
import TemplateToNormal from './comps/TemplateToNormal.vue';
// 🔄vue转jsx语法
import VueToJsx from './comps/VueToJsx.vue';

const list = ['PathTransform', 'HumpTransition', 'LessToCss', 'EsmCommonjs', 'StyleToObject', 'TemplateToNormal', 'VueToJsx'];
const curTab = ref('PathTransform');

function comToName(key: string) {
  return {
    PathTransform: 'windows路径转换',
    HumpTransition: '驼峰转换',
    LessToCss: 'LessToCss',
    EsmCommonjs: 'esm => commonjs',
    StyleToObject: '🔄style转对象',
    TemplateToNormal: '🔄模板字符转普通字符',
    VueToJsx: '🔄vue转jsx语法',
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
