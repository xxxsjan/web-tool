<template>
  <div class="string-transform pt-10 flex flex-col w-full justify-center items-center">
    <div role="tablist" class="tabs tabs-boxed fixed top-12">
      <span role="tab" v-for="item in list" :class="['tab', { 'tab-active': curTab === item }]" :key="item"
        @click="curTab = item">{{ comToName(item) }}</span>
    </div>
    <PathTransform id="PathTransform" v-if="curTab === 'PathTransform'" />
    <HumpTransition id="HumpTransition" v-if="curTab === 'HumpTransition'" />
    <LessToCss id="LessToCss" v-if="curTab === 'LessToCss'" />
    <EsmCommonjs id="EsmCommonjs" v-if="curTab === 'EsmCommonjs'" />


    <StyleToObject id="StyleToObject" v-if="curTab === 'StyleToObject'" />
    <TemplateToNormal id="TemplateToNormal" v-if="curTab === 'TemplateToNormal'" />

  </div>
</template>

<script lang="ts" setup>
import EsmCommonjs from './comps/esm-to-commonjs.vue';
import HumpTransition from './comps/HumpTransition.vue';
import LessToCss from './comps/less-to-css.vue';
import PathTransform from './comps/PathTransform.vue';
import StyleToObject from './comps/StyleToObject.vue';
import TemplateToNormal from './comps/TemplateToNormal.vue';

const list = ['PathTransform', 'HumpTransition', 'LessToCss', 'EsmCommonjs', 'StyleToObject', 'TemplateToNormal'];
const curTab = ref('PathTransform');

function comToName(key: string) {
  return {
    PathTransform: 'windows路径转换',
    HumpTransition: '驼峰转换',
    LessToCss: 'LessToCss',
    EsmCommonjs: 'esm => commonjs',
    StyleToObject: '🔄style转对象',
    TemplateToNormal: '🔄模板字符转普通字符',
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
