<template>
  <div class="home">
    <header class="home-topbar" :class="{ 'is-stuck': stuck }">
      <div class="home-topbar__inner">
        <NuxtLink class="brand" to="/home" aria-label="tools 首页">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <defs>
                <linearGradient id="homeBrandGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#9b93ff" />
                  <stop offset="1" stop-color="#4f46e5" />
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
  'w-[60px] h-[60px] rounded-2xl sm:w-[68px] sm:h-[68px] sm:rounded-[18px]';
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
.home {
  --home-bg: #08090d;
  --home-accent: #8b87ff;
  --glow-a: rgba(139, 135, 255, 0.22);
  --glow-b: rgba(56, 189, 248, 0.1);
  --glow-c: rgba(251, 113, 133, 0.07);
  --home-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --home-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  position: relative;
  isolation: isolate;
  min-height: 100vh;
  background:
    radial-gradient(760px 620px at 40% -8%, var(--glow-a), transparent 70%),
    radial-gradient(620px 520px at 100% 108%, var(--glow-b), transparent 70%),
    radial-gradient(460px 420px at -5% 105%, var(--glow-c), transparent 70%),
    var(--home-bg);
  color: var(--color-base-content);
  font-family: var(--home-font);
}

:global(html[data-theme='light'] .home) {
  --home-bg: #f5f5f2;
  --home-accent: #5a55e6;
  --glow-a: rgba(139, 135, 255, 0.18);
  --glow-b: rgba(56, 189, 248, 0.12);
  --glow-c: rgba(251, 113, 133, 0.08);
}

/* —— 顶栏 —— */
.home-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid transparent;
  background: color-mix(in oklab, var(--home-bg) 72%, transparent);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
  transition: border-color 0.25s ease;
}

.home-topbar.is-stuck {
  border-bottom-color: var(--app-border);
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
  gap: 9px;
  padding: 4px 6px 4px 0;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}

.brand__mark {
  position: relative;
  display: block;
  flex: none;
  width: 28px;
  height: 28px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 6px 16px -8px rgba(109, 99, 255, 0.8);
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
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    inset 0 0 0 1px rgba(255, 255, 255, 0.07);
  pointer-events: none;
}

.brand__name {
  font-size: 16.5px;
  font-weight: 600;
  letter-spacing: -0.035em;
}

.brand__count {
  margin-left: 1px;
  padding: 4px 5px;
  border: 1px solid var(--app-border);
  border-radius: 5px;
  font-family: var(--home-mono);
  font-size: 9.5px;
  line-height: 1;
  color: color-mix(in oklab, var(--color-base-content) 42%, transparent);
}

.home-topbar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 66%, transparent);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.icon-btn:hover {
  color: var(--color-base-content);
  background: color-mix(in oklab, var(--color-base-content) 7%, transparent);
  border-color: var(--app-border);
}

.icon-btn svg {
  width: 17px;
  height: 17px;
}

/* —— 内容 —— */
.home-main {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 22px 24px 56px;
}

.group {
  margin-top: 28px;
}

.group:first-of-type {
  margin-top: 0;
}

.group__label {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
  padding: 0 4px;
}

.group__label h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: color-mix(in oklab, var(--color-base-content) 66%, transparent);
}

.group__label span {
  font-family: var(--home-mono);
  font-size: 9.5px;
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.group__label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--app-border);
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 28px 10px;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  padding: 4px 0;
  border: 0;
  border-radius: 14px;
  background: none;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.app:focus-visible {
  outline: 2px solid var(--home-accent);
  outline-offset: 6px;
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
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  transition: color 0.2s ease;
}

.app:hover .app__name {
  color: var(--color-base-content);
}

.app:hover :deep(.tool-icon-solid) {
  transform: translateY(-3px) scale(1.04);
  filter: brightness(1.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
    0 18px 30px -14px var(--ion-c2);
}

.app:active :deep(.tool-icon-solid) {
  transform: scale(0.93);
  transition-duration: 0.1s;
}

/* —— 页脚 —— */
.home-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 46px;
  padding: 16px 4px 0;
  border-top: 1px solid var(--app-border);
  font-family: var(--home-mono);
  font-size: 9.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.home-empty {
  margin: 0;
  padding: 80px 20px;
  text-align: center;
  font-size: 13px;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .home-topbar__inner {
    padding: 0 20px;
  }

  .home-main {
    padding: 18px 20px 48px;
  }

  .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .home-main {
    padding-top: 16px;
  }

  .group {
    margin-top: 24px;
  }

  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px 4px;
  }

  .app__name {
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-btn,
  .app__name,
  .app :deep(.tool-icon-solid) {
    transition: none !important;
  }
}
</style>
