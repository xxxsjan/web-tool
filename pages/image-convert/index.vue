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
      class="mb-5 flex justify-center sm:mb-6"
      aria-label="转换类型"
    >
      <div
        class="tab-seg w-full"
        role="tablist"
        :style="{ '--seg-count': tabs.length }"
      >
        <span
          class="tab-seg__slider"
          :style="{ '--seg-index': activeIndex }"
          aria-hidden="true"
        />
        <button
          v-for="item in tabs"
          :key="item.key"
          type="button"
          role="tab"
          class="tab-seg__item"
          :class="{ 'tab-seg__item--active': curTab === item.key }"
          :aria-selected="curTab === item.key"
          @click="curTab = item.key"
        >
          <span class="tab-seg__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="tab-seg__label">{{ item.label }}</span>
        </button>
      </div>
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
  title: '图片转换工具',
  icon: 'arrow-sync',
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
const activeIndex = computed(() =>
  tabs.findIndex(t => t.key === curTab.value),
);

const componentMap = {
  ToIco,
  AvifToPng,
  WebpConvert,
  DomToSvg,
};

const getComponent = (name: TabKey) => componentMap[name];
</script>

<style scoped>
/* 分段式 Tab（segmented control） */
.tab-seg {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 9999px;
  border: 1px solid var(--app-border);
  background: color-mix(in oklab, var(--color-base-200) 65%, transparent);
}

.tab-seg__slider {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  width: calc((100% - 0.5rem) / var(--seg-count));
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  border: 1px solid
    color-mix(in oklab, var(--color-primary) 45%, transparent);
  box-shadow: 0 0 0 1px
    color-mix(in oklab, var(--color-primary) 12%, transparent);
  transform: translateX(calc(var(--seg-index) * 100%));
  transition: transform 0.25s ease;
  pointer-events: none;
}

.tab-seg__item {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-radius: 9999px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  transition:
    color 0.2s ease,
    transform 0.15s ease;
}

.tab-seg__item:hover {
  color: var(--color-base-content);
}

.tab-seg__item--active {
  color: var(--color-primary);
  font-weight: 600;
}

.tab-seg__icon {
  font-size: 0.9em;
  line-height: 1;
}

.tab-seg__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 419px) {
  .tab-seg__icon {
    display: none;
  }

  .tab-seg__item {
    padding: 0.4rem 0.35rem;
    font-size: 0.75rem;
  }
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
