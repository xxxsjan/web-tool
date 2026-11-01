<template>
  <div class="home">
    <div class="home__wallpaper" aria-hidden="true" />

    <div class="home__inner">
      <header class="home-hero">
        <h1 class="home-hero__title">工具</h1>
        <p class="home-hero__sub">选择要使用的功能</p>
      </header>

      <div
        v-if="toolList.length"
        ref="snakeRef"
        class="home-snake"
        :style="{ '--cols': String(cols) }"
      >
        <div
          v-for="(row, rowIndex) in snakeRows"
          :key="rowIndex"
          class="snake-row"
          :class="{ 'snake-row--rtl': rowIndex % 2 === 1 }"
          :style="{ '--delay': `${rowIndex * 45}ms` }"
        >
          <button
            v-for="item in row"
            :key="item.path"
            type="button"
            class="tool-tile"
            :title="item.label"
            @click="goTool(item.path)"
          >
            <span class="tool-tile__icon" aria-hidden="true">
              <ToolIcon
                :name="item.icon"
                :size="'3.25rem'"
                class="tool-tile__svg"
              />
            </span>
            <span class="tool-tile__label">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <p v-else class="home-empty">
        暂无已注册工具
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  useToolNav,
  type ToolNavItem,
} from '~/composables/useToolNav';

const { toolList, groupedTools, goTool } = useToolNav();

/** 按分组顺序串成一条连续列表，再蛇形折行 */
const flatTools = computed(() =>
  groupedTools.value.flatMap(g => g.list),
);

const snakeRef = ref<HTMLElement | null>(null);
const cols = ref(4);

const resolveCols = (width: number) => {
  if (width >= 1024) return 7;
  if (width >= 768) return 6;
  if (width >= 480) return 5;
  return 4;
};

const snakeRows = computed(() => {
  const list = flatTools.value;
  const n = Math.max(1, cols.value);
  const rows: ToolNavItem[][] = [];
  for (let i = 0; i < list.length; i += n) {
    rows.push(list.slice(i, i + n));
  }
  return rows;
});

let resizeObserver: ResizeObserver | null = null;

const bindSnakeObserver = (el: HTMLElement | null) => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (!el) return;

  if (typeof ResizeObserver === 'undefined') {
    cols.value = resolveCols(window.innerWidth);
    return;
  }

  resizeObserver = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width ?? el.clientWidth;
    cols.value = resolveCols(width);
  });
  resizeObserver.observe(el);
  cols.value = resolveCols(el.clientWidth);
};

watch(snakeRef, bindSnakeObserver, { flush: 'post', immediate: true });

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped>
.home {
  --ios-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
    'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --ios-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ios-spring: cubic-bezier(0.34, 1.2, 0.64, 1);

  position: relative;
  isolation: isolate;
  min-height: calc(100vh - 4rem);
  overflow: hidden;
  font-family: var(--ios-font);
  -webkit-font-smoothing: antialiased;
}

.home__wallpaper {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(
      ellipse 80% 55% at 12% -8%,
      color-mix(in oklab, var(--color-primary) 14%, transparent),
      transparent 58%
    ),
    radial-gradient(
      ellipse 70% 50% at 96% 8%,
      color-mix(in oklab, var(--color-info, var(--color-primary)) 10%, transparent),
      transparent 55%
    ),
    linear-gradient(
      180deg,
      color-mix(in oklab, var(--color-base-200) 70%, transparent) 0%,
      transparent 42%
    );
}

.home__inner {
  margin: 0 auto;
  width: 100%;
  max-width: 54rem;
  padding: 0.85rem 1rem 5rem;
}

@media (min-width: 640px) {
  .home__inner {
    padding: 1.1rem 1.35rem 5.5rem;
  }
}

.home-hero {
  margin-bottom: 1.35rem;
  padding: 0.35rem 0.2rem 0.15rem;
  animation: home-rise 0.55s var(--ios-ease) both;
}

.home-hero__title {
  margin: 0;
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.08;
  color: var(--color-base-content);
}

.home-hero__sub {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: color-mix(in oklab, var(--color-base-content) 48%, transparent);
}

/* —— 蛇形连续排布 —— */
.home-snake {
  --cols: 4;
  border-radius: 1.35rem;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 8%, transparent);
  background: color-mix(in oklab, var(--color-base-100) 72%, transparent);
  box-shadow:
    0 1px 0 color-mix(in oklab, #fff 10%, transparent) inset,
    0 12px 32px -20px rgb(0 0 0 / 0.35);
  backdrop-filter: saturate(180%) blur(22px);
  -webkit-backdrop-filter: saturate(180%) blur(22px);
  padding: 0.95rem 0.55rem 1.05rem;
}

@media (min-width: 640px) {
  .home-snake {
    padding: 1.1rem 0.75rem 1.2rem;
  }
}

.snake-row {
  display: flex;
  flex-direction: row;
  width: 100%;
  animation: home-rise 0.5s var(--ios-ease) both;
  animation-delay: var(--delay, 0ms);
}

.snake-row + .snake-row {
  margin-top: 0.85rem;
}

/* 奇行：从右往左排，未满行贴右，形成拐弯 */
.snake-row--rtl {
  flex-direction: row-reverse;
}

.tool-tile {
  display: flex;
  flex: 0 0 calc(100% / var(--cols));
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: calc(100% / var(--cols));
  max-width: calc(100% / var(--cols));
  padding: 0.15rem 0.1rem 0.05rem;
  background: transparent;
  border: none;
  border-radius: 0.85rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.22s var(--ios-spring);
}

.tool-tile:hover {
  transform: translateY(-1px);
}

.tool-tile:active {
  transform: scale(0.9);
  transition-duration: 0.08s;
}

.tool-tile__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  background: none;
  border: none;
  box-shadow: none;
  transition: transform 0.28s var(--ios-spring);
}

@media (min-width: 768px) {
  .tool-tile__icon {
    width: 3.6rem;
    height: 3.6rem;
  }
}

.tool-tile:hover .tool-tile__icon {
  transform: scale(1.08);
}

.tool-tile:active .tool-tile__icon {
  transform: scale(0.94);
}

.tool-tile__svg {
  width: 3.25rem !important;
  height: 3.25rem !important;
}

@media (min-width: 768px) {
  .tool-tile__svg {
    width: 3.6rem !important;
    height: 3.6rem !important;
  }
}

.tool-tile__svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.tool-tile__label {
  display: -webkit-box;
  width: 100%;
  max-width: 5.5rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 550;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: color-mix(in oklab, var(--color-base-content) 82%, transparent);
}

@media (min-width: 768px) {
  .tool-tile__label {
    max-width: 6rem;
    font-size: 0.92rem;
  }
}

.home-empty {
  margin: 0.5rem 0 0;
  border-radius: 1.25rem;
  border: 1px dashed color-mix(in oklab, var(--color-base-content) 16%, transparent);
  background: color-mix(in oklab, var(--color-base-100) 55%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 2.75rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero,
  .snake-row,
  .tool-tile,
  .tool-tile__icon {
    animation: none !important;
    transition: none !important;
  }
}
</style>
