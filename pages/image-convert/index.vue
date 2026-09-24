<template>
  <div class="mx-auto w-full max-w-3xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        图片转换工具
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        ICO、AVIF、WebP、DOM 一站式转换
      </p>
    </header>

    <nav
      class="mb-5 flex flex-wrap justify-center gap-2 sm:mb-6"
      aria-label="转换类型"
    >
      <button
        v-for="item in tabs"
        :key="item.key"
        type="button"
        class="tab-chip"
        :class="{ 'tab-chip--active': curTab === item.key }"
        @click="curTab = item.key"
      >
        <span class="tab-chip__icon" aria-hidden="true">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <Transition name="panel-fade" mode="out-in">
      <section :key="curTab" class="overflow-hidden rounded-2xl tool-panel">
        <div class="tool-panel-head px-4 py-3 sm:px-5">
          <h2 class="text-sm font-semibold text-base-content sm:text-base">
            {{ currentTab?.label }}
          </h2>
          <p class="mt-0.5 text-[11px] text-base-content/45 sm:text-xs">
            {{ currentTab?.desc }}
          </p>
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
  title: '🎨图片转换工具',
  group: '媒体类',
});

import ToIco from './to-ico.vue';
import AvifToPng from './avif-to-png.vue';
import WebpConvert from './webp-convert.vue';
import DomToSvg from './dom-to-svg.vue';

type TabKey = 'ToIco' | 'AvifToPng' | 'WebpConvert' | 'DomToSvg';

const tabs = [
  {
    key: 'ToIco' as const,
    label: '图片转 ICO',
    icon: '🖼️',
    desc: '上传图片，按指定尺寸导出 ICO',
  },
  {
    key: 'AvifToPng' as const,
    label: 'AVIF 转 PNG',
    icon: '📷',
    desc: '浏览器端解码，单文件建议不超过 10MB',
  },
  {
    key: 'WebpConvert' as const,
    label: 'WebP 转换',
    icon: '🌀',
    desc: 'WebP 转 PNG / JPG / GIF，动图尽量保留全部帧',
  },
  {
    key: 'DomToSvg' as const,
    label: 'DOM 转 PNG',
    icon: '🧩',
    desc: '粘贴 HTML 片段，预览并导出为 PNG',
  },
];

const curTab = ref<TabKey>('ToIco');
const currentTab = computed(() => tabs.find(t => t.key === curTab.value));

const componentMap = {
  ToIco,
  AvifToPng,
  WebpConvert,
  DomToSvg,
};

const getComponent = (name: TabKey) => componentMap[name];
</script>

<style scoped>
.tab-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid var(--app-border-strong);
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
  box-shadow: 0 0 0 1px
    color-mix(in oklab, var(--color-primary) 20%, transparent);
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
