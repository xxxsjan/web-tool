<template>
  <div class="home">
    <header class="home-topbar" :class="{ 'is-stuck': stuck }">
      <div class="home-topbar__inner">
        <NuxtLink class="brand" to="/home" aria-label="tools 首页">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <defs>
                <linearGradient id="homeBrandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#60a5fa" />
                  <stop offset="1" stop-color="#1d4ed8" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="9" fill="url(#homeBrandGrad)" />
              <rect x="7.5" y="8.5" width="17" height="4.2" rx="2.1" fill="#fff" />
              <rect x="13.4" y="12.7" width="5.2" height="11" rx="2.6" fill="#fff" />
            </svg>
          </span>
          <span class="brand__name">tools</span>
          <span class="brand__count">{{ toolList.length }}</span>
        </NuxtLink>

        <div class="home-topbar__actions">
          <button
            class="icon-btn"
            type="button"
            :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
            :title="isDark ? '切换到亮色' : '切换到暗色'"
            @click="toggleTheme"
          >
            <el-icon :size="18">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </el-icon>
          </button>
          <a
            class="icon-btn"
            href="https://github.com/xxxsjan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>

    <main class="home-main">
      <h1 class="sr-only">工具</h1>

      <template v-if="toolList.length">
        <section
          v-for="group in orderedGroups"
          :key="group.group"
          class="group"
        >
          <div class="group__label">
            <h2>{{ group.group }}</h2>
            <span>{{ pad2(group.list.length) }}</span>
          </div>

          <div class="grid">
            <button
              v-for="item in group.list"
              :key="item.path"
              class="app"
              type="button"
              :title="item.title"
              @click="goTool(item.path)"
            >
              <ToolOutlineIcon
                solid
                :name="item.icon"
                :box="iconBox"
                :size="iconSize"
              />
              <span class="app__name">{{ labelOf(item) }}</span>
            </button>
          </div>
        </section>

        <footer class="home-foot">
          <span>
            {{ toolList.length }} apps · {{ orderedGroups.length }} groups
          </span>
          <span>点开即用</span>
        </footer>
      </template>

      <p v-else class="home-empty">暂无已注册工具</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Moon, Sunny } from '@element-plus/icons-vue';
import { useThemeStore } from '~/stores/theme';
import {
  useToolNav,
  type ToolNavItem,
} from '~/composables/useToolNav';

definePageMeta({
  title: '工具',
});

const { toolList, groupedTools, goTool } = useToolNav();
const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
const { toggleTheme } = themeStore;

/** 首页固定分组顺序；未列出的分组排最后 */
const groupOrder = ['工具', '媒体类', '抖音类', '娱乐类'];

/** 首页展示顺序（按路径），未列出的工具排在分组末尾 */
const preferredOrder = [
  '/whiteboard',
  '/preview-html',
  '/github-image-host',
  '/svg-preview',
  '/text-editor',
  '/image-matting',
  '/text-to-speech',
  '/image-convert',
  '/cut-image',
  '/gptsovits',
  '/to-audio',
  '/dy-download',
  '/dy-emoji',
  '/dy-url',
  '/ikun-keyboard',
];

const orderOf = (path: string) => {
  const index = preferredOrder.indexOf(path);
  return index < 0 ? preferredOrder.length : index;
};

const orderedGroups = computed(() => {
  const weight = (name: string) => {
    const index = groupOrder.indexOf(name);
    return index < 0 ? groupOrder.length : index;
  };
  return [...groupedTools.value]
    .sort((a, b) => weight(a.group) - weight(b.group))
    .map(group => ({
      ...group,
      list: [...group.list].sort(
        (a, b) => orderOf(a.path) - orderOf(b.path),
      ),
    }));
});

/** 统一图标下方的短名（title 里仍是完整标题） */
const nameOverrides: Record<string, string> = {
  '/whiteboard': 'Excalidraw 画板',
  '/preview-html': 'HTML 预览',
  '/github-image-host': 'Git 图床',
  '/svg-preview': 'SVG 预览',
  '/text-editor': '文本编辑',
  '/image-matting': '在线抠图',
  '/text-to-speech': '文本转语音',
  '/image-convert': '图片转换',
  '/cut-image': '图片去黑边',
  '/gptsovits': 'GPT-SoVITS 调试',
  '/to-audio': '视频转音频',
  '/dy-download': '无水印下载',
  '/dy-emoji': '抖音 Emoji',
  '/dy-url': '抖音转链',
  '/ikun-keyboard': 'IKUN 键盘',
};

const labelOf = (item: ToolNavItem) =>
  nameOverrides[item.path] ?? item.label;

const pad2 = (value: number) => String(value).padStart(2, '0');

const iconBox =
  'w-[60px] h-[60px] rounded-[18px] sm:w-[68px] sm:h-[68px] sm:rounded-[20px]';
const iconSize = 'h-7 w-7 sm:h-[31px] sm:w-[31px]';

/* 顶栏滚动后出现分隔线 */
const stuck = ref(false);
const onScroll = () => {
  stuck.value = window.scrollY > 4;
};

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
/* ———————————— 全局变量 & 背景光斑 ———————————— */
.home {
  /* 亮蓝点缀主色 */
  --home-bg: #07080c;
  --home-accent: #3b82f6;
  --home-accent-soft: rgba(59, 130, 246, 0.18);
  --home-accent-glow: rgba(96, 165, 250, 0.55);

  /* 渐变光斑 */
  --glow-blue-a: rgba(59, 130, 246, 0.28);
  --glow-blue-b: rgba(14, 165, 233, 0.18);
  --glow-purple: rgba(168, 85, 247, 0.14);
  --glow-cyan: rgba(34, 211, 238, 0.12);

  /* 玻璃卡 */
  --glass-bg: rgba(255, 255, 255, 0.035);
  --glass-bg-hover: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.09);
  --glass-border-hover: rgba(96, 165, 250, 0.35);
  --glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 10px 40px -18px rgba(0, 0, 0, 0.6),
    0 2px 8px -2px rgba(0, 0, 0, 0.4);
  --glass-shadow-hover: 0 18px 50px -12px rgba(14, 165, 233, 0.25),
    0 4px 14px -2px rgba(0, 0, 0, 0.5);

  --home-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --home-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  position: relative;
  isolation: isolate;
  min-height: 100vh;
  color: var(--color-base-content);
  font-family: var(--home-font);
  background:
    /* 左上：亮蓝主光斑 */
    radial-gradient(720px 640px at 18% -12%, var(--glow-blue-a), transparent 68%),
    /* 右上：亮蓝次光斑 */
    radial-gradient(560px 480px at 82% -5%, var(--glow-blue-b), transparent 66%),
    /* 右下：紫色对比光斑 */
    radial-gradient(680px 560px at 108% 112%, var(--glow-purple), transparent 70%),
    /* 左下：青色反光斑 */
    radial-gradient(520px 460px at -8% 108%, var(--glow-cyan), transparent 68%),
    /* 基底：深空 */
    var(--home-bg);
}

/* 背景装饰点（不影响布局） */
.home::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(
      circle at 1px 1px,
      rgba(255, 255, 255, 0.035) 1px,
      transparent 0
    );
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%);
}

/* —— 亮色主题分支 —— */
:global(html[data-theme='light'] .home) {
  --home-bg: #eef1f7;
  --home-accent: #2563eb;
  --home-accent-soft: rgba(37, 99, 235, 0.15);
  --home-accent-glow: rgba(59, 130, 246, 0.35);

  --glow-blue-a: rgba(59, 130, 246, 0.18);
  --glow-blue-b: rgba(14, 165, 233, 0.14);
  --glow-purple: rgba(139, 92, 246, 0.1);
  --glow-cyan: rgba(6, 182, 212, 0.1);

  --glass-bg: rgba(255, 255, 255, 0.55);
  --glass-bg-hover: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(37, 99, 235, 0.12);
  --glass-border-hover: rgba(59, 130, 246, 0.4);
  --glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --glass-shadow: 0 8px 32px -16px rgba(30, 64, 175, 0.25),
    0 2px 6px -2px rgba(30, 64, 175, 0.1);
  --glass-shadow-hover: 0 16px 48px -12px rgba(37, 99, 235, 0.22),
    0 4px 12px -2px rgba(30, 64, 175, 0.12);
}

/* ———————————— 顶栏 ———————————— */
.home-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid transparent;
  background: color-mix(in oklab, var(--home-bg) 55%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
  backdrop-filter: blur(24px) saturate(170%);
  transition: border-color 0.25s ease, background 0.25s ease;
}

.home-topbar.is-stuck {
  border-bottom-color: var(--glass-border);
  background: color-mix(in oklab, var(--home-bg) 70%, transparent);
}

.home-topbar__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 980px;
  height: 60px;
  margin: 0 auto;
  padding: 0 24px;
}

.brand {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 10px;
  padding: 5px 10px 5px 4px;
  border-radius: 14px;
  color: inherit;
  text-decoration: none;
  transition: background 0.2s ease;
}

.brand:hover {
  background: rgba(255, 255, 255, 0.04);
}

.brand__mark {
  position: relative;
  display: block;
  flex: none;
  width: 30px;
  height: 30px;
  overflow: hidden;
  border-radius: 9px;
  box-shadow: 0 8px 20px -8px rgba(59, 130, 246, 0.75);
}

.brand__mark svg {
  display: block;
  width: 100%;
  height: 100%;
}

.brand__mark::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.brand__name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.brand__count {
  margin-left: 1px;
  padding: 4px 6px;
  border: 1px solid var(--glass-border);
  border-radius: 7px;
  font-family: var(--home-mono);
  font-size: 9.5px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.03);
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.home-topbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  background: var(--glass-bg);
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.icon-btn:hover {
  color: var(--home-accent);
  background: var(--glass-bg-hover);
  border-color: var(--home-accent-glow);
  box-shadow: 0 0 0 4px var(--home-accent-soft);
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0) scale(0.96);
}

.icon-btn svg {
  width: 17px;
  height: 17px;
}

/* ———————————— 内容区 ———————————— */
.home-main {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 24px 56px;
}

.group {
  margin-top: 32px;
}

.group:first-of-type {
  margin-top: 0;
}

.group__label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 0 6px;
}

.group__label h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.group__label span {
  font-family: var(--home-mono);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.group__label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    var(--glass-border) 0%,
    transparent 100%
  );
}

/* ———————————— 网格 & 玻璃卡 ———————————— */
.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 20px 14px;
}

.app {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px 14px;
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
  box-shadow: var(--glass-inset), var(--glass-shadow);
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

/* 卡片顶部高光线 */
.app::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  pointer-events: none;
}

/* hover 时亮蓝光带 */
.app::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--home-accent-glow) 0%,
    transparent 40%,
    transparent 60%,
    var(--glow-purple) 100%
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.app:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--glass-shadow-hover);
}

.app:hover::after {
  opacity: 1;
}

.app:focus-visible {
  outline: 2px solid var(--home-accent);
  outline-offset: 4px;
}

.app__name {
  display: -webkit-box;
  width: 100%;
  max-width: 96px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 11.5px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  transition: color 0.25s ease;
}

.app:hover .app__name {
  color: var(--color-base-content);
}

/* icon 容器 hover 动效 —— 亮蓝光晕 */
.app:hover :deep(.tool-icon-solid) {
  transform: translateY(-2px) scale(1.05);
  filter: brightness(1.08) saturate(1.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 14px 28px -10px var(--home-accent-glow);
}

.app:active {
  transform: translateY(-1px) scale(0.98);
  transition-duration: 0.1s;
}

.app:active :deep(.tool-icon-solid) {
  transform: scale(0.92);
  transition-duration: 0.1s;
}

/* ———————————— 页脚 ———————————— */
.home-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 48px;
  padding: 16px 18px;
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  font-family: var(--home-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.home-empty {
  margin: 0;
  padding: 80px 20px;
  text-align: center;
  font-size: 13px;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

/* ———————————— 响应式 ———————————— */
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 18px 10px;
  }
}

@media (max-width: 760px) {
  .home-topbar__inner {
    padding: 0 20px;
  }

  .home-main {
    padding: 22px 20px 48px;
  }

  .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 16px 8px;
  }

  .app {
    padding: 16px 6px 12px;
    border-radius: 18px;
  }
}

@media (max-width: 620px) {
  .home-main {
    padding-top: 18px;
  }

  .group {
    margin-top: 26px;
  }

  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px 6px;
  }

  .app {
    padding: 14px 4px 10px;
    border-radius: 16px;
  }

  .app__name {
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 4px;
  }

  .app {
    padding: 14px 2px 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-btn,
  .app,
  .app__name,
  .app :deep(.tool-icon-solid),
  .app::after {
    transition: none !important;
  }
}
</style>
