<template>
  <div class="mx-auto w-full max-w-6xl px-3 pb-12 sm:px-4">
    <header class="mb-6 text-center sm:mb-8">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        字符处理
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        路径、命名、模块语法、样式与模板一键转换
      </p>
    </header>

    <nav
      class="mb-5 flex flex-wrap justify-center gap-2 sm:mb-6"
      aria-label="转换类型">
      <button
        v-for="item in tabs"
        :key="item.key"
        type="button"
        class="tab-chip"
        :class="{ 'tab-chip--active': curTab === item.key }"
        @click="curTab = item.key">
        <span class="tab-chip__icon" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <Transition name="panel-fade" mode="out-in">
      <section
        :key="curTab"
        class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm">
        <div
          class="flex items-center justify-between gap-3 border-b border-base-300/50 px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <h2 class="truncate text-sm font-semibold text-base-content sm:text-base">
              {{ currentTab?.label }}
            </h2>
            <p class="mt-0.5 truncate text-[11px] text-base-content/45 sm:text-xs">
              {{ currentTab?.desc }}
            </p>
          </div>
        </div>
        <div class="p-4 sm:p-5">
          <component :is="getComponent(curTab)" />
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '🔄字符处理',
  group: '工具',
});

import EsmCommonjs from './comps/esm-to-commonjs.vue';
import HumpTransition from './comps/HumpTransition.vue';
import PathTransform from './comps/PathTransform.vue';
import TemplateToNormal from './comps/TemplateToNormal.vue';
import VueToJsx from './comps/VueToJsx.vue';

const StyleToObject = defineAsyncComponent(() =>
  import('./comps/StyleToObject.vue'),
);

const tabs = [
  {
    key: 'PathTransform',
    label: '路径转换',
    icon: '📁',
    desc: 'Windows 反斜杠路径转为正斜杠',
  },
  {
    key: 'HumpTransition',
    label: '驼峰转换',
    icon: '🔤',
    desc: 'kebab / camel / Pascal 命名互转',
  },
  {
    key: 'EsmCommonjs',
    label: '模块格式',
    icon: '📦',
    desc: 'ESM import 与 CommonJS require 互转',
  },
  {
    key: 'StyleToObject',
    label: '样式对象',
    icon: '🎨',
    desc: 'CSS 声明转为 JS 样式对象',
  },
  {
    key: 'TemplateToNormal',
    label: '模板转换',
    icon: '📝',
    desc: '模板字符串转为字符串拼接',
  },
  {
    key: 'VueToJsx',
    label: 'Vue → JSX',
    icon: '⚛️',
    desc: 'Vue 模板属性与标签转为 JSX',
  },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const curTab = ref<TabKey>('PathTransform');

const currentTab = computed(() => tabs.find((t) => t.key === curTab.value));

const componentMap = {
  EsmCommonjs,
  HumpTransition,
  PathTransform,
  StyleToObject,
  TemplateToNormal,
  VueToJsx,
};

const getComponent = (name: TabKey) => componentMap[name];
</script>

<style scoped>
.tab-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 70%, transparent);
  background: color-mix(in oklab, var(--color-base-200) 55%, transparent);
  padding: 0.4rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.tab-chip:hover {
  border-color: color-mix(in oklab, var(--color-primary) 45%, transparent);
  color: var(--color-base-content);
  transform: translateY(-1px);
}

.tab-chip--active {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  background: color-mix(in oklab, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-primary) 20%, transparent);
}

.tab-chip__icon {
  font-size: 0.9em;
  line-height: 1;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
