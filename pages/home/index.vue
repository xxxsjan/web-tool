<template>
  <div class="home">
    <div class="home__glow" aria-hidden="true" />

    <div class="home__inner">
      <section
        v-for="(group, groupIndex) in groupedTools"
        :key="group.group"
        class="home-group"
        :style="{ '--delay': `${groupIndex * 40}ms` }"
      >
        <div class="home-group__head">
          <h2 class="home-group__title">{{ group.group }}</h2>
          <span class="home-group__count">{{ group.list.length }}</span>
        </div>

        <div class="home-grid">
          <button
            v-for="item in group.list"
            :key="item.path"
            type="button"
            class="tool-tile"
            :title="item.label"
            @click="goTool(item.path)"
          >
            <span class="tool-tile__icon" aria-hidden="true">
              <ToolIcon :name="item.icon" class="tool-tile__svg" />
            </span>
            <span class="tool-tile__label">{{ item.label }}</span>
          </button>
        </div>
      </section>

      <p v-if="!toolList.length" class="home-empty">
        暂无已注册工具
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToolNav } from '~/composables/useToolNav';

const { toolList, groupedTools, goTool } = useToolNav();
</script>

<style scoped>
.home {
  position: relative;
  isolation: isolate;
  min-height: calc(100vh - 4rem);
  overflow: hidden;
}

.home__glow {
  pointer-events: none;
  position: absolute;
  inset: -20% -10% auto;
  height: min(42vh, 22rem);
  background:
    radial-gradient(ellipse 55% 70% at 18% 30%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 70%),
    radial-gradient(ellipse 50% 60% at 82% 20%, color-mix(in oklab, var(--color-base-content) 7%, transparent), transparent 72%);
  opacity: 0.85;
  z-index: -1;
}

.home__inner {
  margin: 0 auto;
  width: 100%;
  max-width: 72rem;
  padding: 1.25rem 1rem 4rem;
}

@media (min-width: 640px) {
  .home__inner {
    padding: 1.5rem 1.5rem 5rem;
  }
}

.home-group {
  margin-bottom: 1.75rem;
  animation: home-rise 0.5s ease both;
  animation-delay: var(--delay, 0ms);
}

.home-group:last-child {
  margin-bottom: 0;
}

.home-group__head {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin-bottom: 0.7rem;
  padding-left: 0.1rem;
}

.home-group__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--color-base-content);
}

.home-group__count {
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

@media (min-width: 480px) {
  .home-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .home-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
  }
}

@media (min-width: 1024px) {
  .home-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .home-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

.tool-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0.85rem 0.65rem;
  text-align: center;
  border-radius: 1.05rem;
  border: 1px solid var(--app-border);
  background: color-mix(in oklab, var(--color-base-100) 84%, transparent);
  box-shadow:
    0 1px 0 color-mix(in oklab, var(--color-base-content) 4%, transparent) inset,
    0 10px 22px -18px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(10px);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.tool-tile:hover {
  border-color: color-mix(in oklab, var(--color-primary) 42%, transparent);
  background: color-mix(in oklab, var(--color-base-200) 55%, var(--color-base-100));
  transform: translateY(-2px) scale(1.015);
  box-shadow:
    0 1px 0 color-mix(in oklab, var(--color-base-content) 5%, transparent) inset,
    0 16px 28px -14px rgb(0 0 0 / 0.5);
}

.tool-tile:active {
  transform: translateY(0) scale(1);
}

.tool-tile__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.95rem;
  color: color-mix(in oklab, var(--color-primary) 78%, var(--color-base-content));
  background: color-mix(in oklab, var(--color-primary) 12%, var(--color-base-200));
  border: 1px solid color-mix(in oklab, var(--color-primary) 18%, transparent);
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.tool-tile__svg {
  font-size: 1.55rem;
}

@media (min-width: 768px) {
  .tool-tile__icon {
    width: 3.6rem;
    height: 3.6rem;
  }

  .tool-tile__svg {
    font-size: 1.75rem;
  }
}

.tool-tile:hover .tool-tile__icon {
  transform: scale(1.07);
  background: color-mix(in oklab, var(--color-primary) 14%, var(--color-base-200));
}

.tool-tile__label {
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--color-base-content);
  transition: color 0.2s ease;
}

@media (min-width: 768px) {
  .tool-tile__label {
    font-size: 0.88rem;
  }
}

.tool-tile:hover .tool-tile__label {
  color: var(--color-primary);
}

.home-empty {
  margin: 0;
  border-radius: 1rem;
  border: 1px dashed var(--app-border-strong);
  padding: 2.5rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: color-mix(in oklab, var(--color-base-content) 48%, transparent);
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-group,
  .tool-tile,
  .tool-tile__icon {
    animation: none !important;
    transition: none !important;
  }
}
</style>
