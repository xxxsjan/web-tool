<template>
  <!-- 通用顶栏：对齐 home-topbar 的毛玻璃视觉风格 -->
  <header
    v-show="shouldShowBackHomeBtn"
    class="app-header"
    :class="{ 'is-stuck': stuck }"
  >
    <div class="app-header__inner">
      <!-- 左侧 brand -->
      <NuxtLink class="brand" to="/home" aria-label="tools 首页">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <defs>
              <linearGradient id="appHeaderBrandGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#60a5fa" />
                <stop offset="1" stop-color="#1d4ed8" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="9" fill="url(#appHeaderBrandGrad)" />
            <rect x="7.5" y="8.5" width="17" height="4.2" rx="2.1" fill="#fff" />
            <rect x="13.4" y="12.7" width="5.2" height="11" rx="2.6" fill="#fff" />
          </svg>
        </span>
        <span class="brand__name">tools</span>
      </NuxtLink>

      <!-- 中间分组导航 -->
      <nav
        class="nav-col flex-1 min-w-0 overflow-visible"
        aria-label="工具分组导航"
      >
        <div ref="navRowRef" class="nav-row relative flex flex-wrap items-center gap-0.5 py-1">
          <!-- 滑动胶囊高亮 -->
          <span ref="capsuleRef" class="nav-capsule" aria-hidden="true" />
          <div
            v-for="group in groupedTools"
            :key="group.group"
            class="relative shrink-0"
            @mouseenter="onGroupEnter(group.group)"
            @mouseleave="onGroupLeave"
          >
            <button
              :ref="el => setGroupBtnRef(group.group, el)"
              type="button"
              class="group-btn"
              :class="{ 'group-btn--active': isGroupActive(group) }"
            >
              {{ group.group }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 opacity-50 transition-transform"
                :class="{ 'rotate-180': openGroup === group.group }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              v-show="openGroup === group.group"
              class="absolute left-0 top-[calc(100%-2px)] z-[110] min-w-[13rem] max-w-[min(18rem,calc(100vw-1rem))] pt-2"
              :class="group.group === groupedTools[groupedTools.length - 1]?.group ? 'left-auto right-0' : ''"
            >
              <div class="nav-submenu">
                <button
                  v-for="item in group.list"
                  :key="item.path"
                  type="button"
                  class="nav-submenu__item"
                  :class="{ 'nav-submenu__item--active': route.path === item.path }"
                  @click="onSelectTool(item.path)"
                >
                  <span class="nav-submenu__icon">
                    <ToolIcon :name="item.icon" :size="20" />
                  </span>
                  <span class="nav-submenu__label">{{ item.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- 右侧按钮组 -->
      <div class="app-header__actions">
        <button
          type="button"
          class="icon-btn"
          :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
          :title="isDark ? '切换到亮色' : '切换到暗色'"
          @click="toggleTheme"
        >
          <el-icon :size="18">
            <Sunny v-if="isDark" />
            <Moon v-else />
          </el-icon>
        </button>

        <div class="relative">
          <span class="absolute top-0 right-0 flex h-2 w-2 translate-x-1/4 -translate-y-1/4">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2 bg-sky-500"
            ></span>
          </span>
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
    </div>
  </header>

  <!-- 欢迎页无导航栏时仍可切换主题 -->
  <button
    v-show="shouldShowFloatingTheme"
    type="button"
    class="btn btn-ghost btn-circle fixed top-4 right-4 z-50 bg-base-100/80 shadow-md"
    :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
    :title="isDark ? '切换到亮色' : '切换到暗色'"
    @click="toggleTheme"
  >
    <el-icon :size="20">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </button>
</template>

<script setup>
import { Moon, Sunny } from '@element-plus/icons-vue';
import gsap from 'gsap';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '~/stores/theme';
import { useToolNav } from '~/composables/useToolNav';

const route = useRoute();
const themeStore = useThemeStore();
const { isDark } = storeToRefs(themeStore);
const { toggleTheme } = themeStore;
const { groupedTools, goTool } = useToolNav();

const openGroup = ref('');
/** 点击子项后强制收起，直到鼠标离开该分组再允许悬停展开 */
const locked = ref(false);
let leaveTimer = 0;

const isGroupActive = group =>
  group.list.some(item => item.path === route.path);

/* —— 滑动胶囊高亮（技术参考 LeiBox fluid-tooltip：gsap expo.out 补间） —— */
const navRowRef = ref(null);
const capsuleRef = ref(null);
const groupBtnRefs = new Map();
let capsuleTween = null;
let capsuleShown = false;

const setGroupBtnRef = (name, el) => {
  if (el) groupBtnRefs.set(name, el);
  else groupBtnRefs.delete(name);
};

const capsulePaint = () => {
  const capsule = capsuleRef.value;
  if (!capsule) return;
  const s = capsule.dataset;
  capsule.style.transform = `translate(${s.x || 0}px, ${s.y || 0}px)`;
  capsule.style.width = `${s.w || 0}px`;
  capsule.style.height = `${s.h || 0}px`;
  capsule.style.opacity = s.o || '0';
};

const capsuleShowFor = name => {
  const row = navRowRef.value;
  const capsule = capsuleRef.value;
  const btn = groupBtnRefs.get(name);
  if (!row || !capsule || !btn) return;
  const rowRect = row.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const first = !capsuleShown;
  capsuleShown = true;
  capsuleTween?.kill();
  capsuleTween = gsap.to(capsule.dataset, {
    x: btnRect.left - rowRect.left,
    y: btnRect.top - rowRect.top,
    w: btnRect.width,
    h: btnRect.height,
    o: 1,
    duration: first ? 0.15 : 0.43,
    ease: first ? 'power2.out' : 'expo.out',
    overwrite: true,
    onUpdate: capsulePaint,
  });
};

const capsuleHide = () => {
  const capsule = capsuleRef.value;
  if (!capsule || !capsuleShown) return;
  capsuleShown = false;
  capsuleTween?.kill();
  capsuleTween = gsap.to(capsule.dataset, {
    o: 0,
    duration: 0.15,
    ease: 'power2.out',
    overwrite: true,
    onUpdate: capsulePaint,
  });
};

const onGroupEnter = name => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = 0;
  }
  if (locked.value) {
    capsuleHide();
    return;
  }
  capsuleShowFor(name);
  openGroup.value = name;
};

const onGroupLeave = () => {
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = window.setTimeout(() => {
    openGroup.value = '';
    locked.value = false;
    capsuleHide();
    leaveTimer = 0;
  }, 120);
};

const onSelectTool = async path => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = 0;
  }
  openGroup.value = '';
  locked.value = true;
  capsuleHide();
  await goTool(path);
};

/* —— 滚动后显示下分隔线 —— */
const stuck = ref(false);
const onScroll = () => {
  stuck.value = window.scrollY > 4;
};

const shouldShowBackHomeBtn = computed(() => {
  return route && route.path !== '/' && route.path !== '/home';
});

/** 首页 /home 自带顶栏，这里只给欢迎页留悬浮主题按钮 */
const shouldShowFloatingTheme = computed(() => route.path === '/');

onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onUnmounted(() => {
  if (leaveTimer) clearTimeout(leaveTimer);
  capsuleTween?.kill();
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
/* ———————————— CSS 变量（对齐 home-topbar 毛玻璃视觉体系） ———————————— */
.app-header {
  /* 亮蓝点缀主色 */
  --ah-accent: #3b82f6;
  --ah-accent-soft: rgba(59, 130, 246, 0.18);
  --ah-accent-glow: rgba(96, 165, 250, 0.55);

  /* 玻璃卡 */
  --ah-glass-bg: rgba(255, 255, 255, 0.035);
  --ah-glass-bg-hover: rgba(255, 255, 255, 0.07);
  --ah-glass-border: rgba(255, 255, 255, 0.09);
  --ah-glass-border-hover: rgba(96, 165, 250, 0.35);

  /* 胶囊高亮 */
  --ah-capsule-bg: color-mix(
    in oklab,
    var(--color-base-content) 10%,
    transparent
  );

  position: sticky;
  top: 0;
  z-index: 30;
  width: 100%;
  border-bottom: 1px solid transparent;
  background: color-mix(in oklab, var(--color-base-100) 55%, transparent);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
  backdrop-filter: blur(24px) saturate(170%);
  transition:
    border-color 0.25s ease,
    background 0.25s ease;
}

.app-header.is-stuck {
  border-bottom-color: var(--ah-glass-border);
  background: color-mix(in oklab, var(--color-base-100) 75%, transparent);
}

/* —— 亮色主题分支 —— */
:global(html[data-theme='light'] .app-header) {
  --ah-accent: #2563eb;
  --ah-accent-soft: rgba(37, 99, 235, 0.15);
  --ah-accent-glow: rgba(59, 130, 246, 0.35);

  --ah-glass-bg: rgba(255, 255, 255, 0.55);
  --ah-glass-bg-hover: rgba(255, 255, 255, 0.8);
  --ah-glass-border: rgba(37, 99, 235, 0.12);
  --ah-glass-border-hover: rgba(59, 130, 246, 0.4);
}

/* ———————————— 内容容器 ———————————— */
.app-header__inner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 980px;
  height: 60px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ———————————— 左侧 brand ———————————— */
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

:global(html[data-theme='light'] .app-header) .brand:hover {
  background: rgba(0, 0, 0, 0.04);
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

/* ———————————— 中间分组导航 ———————————— */
.nav-col {
  display: flex;
  align-items: center;
}

.nav-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
}

.nav-row > div {
  position: relative;
  z-index: 1;
}

/* 胶囊高亮 */
.nav-capsule {
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: 999px;
  background: var(--ah-capsule-bg);
  opacity: 0;
  will-change: transform, width, height, opacity;
}

/* 分组按钮（玻璃态风格） */
.group-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.group-btn:hover {
  color: var(--color-base-content);
  background: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.group-btn--active {
  color: var(--ah-accent);
  border-color: var(--ah-glass-border-hover);
  background: var(--ah-glass-bg);
}

/* ———————————— 下拉子菜单 ———————————— */
.nav-submenu {
  border: 1px solid var(--ah-glass-border);
  border-radius: 14px;
  background: color-mix(in oklab, var(--color-base-100) 92%, transparent);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
  box-shadow:
    0 12px 40px -12px rgba(0, 0, 0, 0.4),
    0 4px 14px -4px rgba(0, 0, 0, 0.2);
  padding: 6px;
}

.nav-submenu__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  height: 2.4rem;
  padding: 0 0.625rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 85%, transparent);
  font-size: 0.875rem;
  font-weight: 450;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-submenu__item:hover {
  background: color-mix(in oklab, var(--ah-accent) 12%, transparent);
  color: var(--ah-accent);
}

.nav-submenu__item--active {
  background: var(--ah-glass-bg);
  color: var(--ah-accent);
}

.nav-submenu__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  overflow: hidden;
  line-height: 0;
}

.nav-submenu__icon :deep(.tool-icon) {
  width: 1.25rem !important;
  height: 1.25rem !important;
}

.nav-submenu__label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.25;
}

/* ———————————— 右侧按钮组 ———————————— */
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

/* 通用 icon-btn（对齐 home-topbar） */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--ah-glass-border);
  border-radius: 12px;
  background: var(--ah-glass-bg);
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.icon-btn:hover {
  color: var(--ah-accent);
  background: var(--ah-glass-bg-hover);
  border-color: var(--ah-accent-glow);
  box-shadow: 0 0 0 4px var(--ah-accent-soft);
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0) scale(0.96);
}

.icon-btn svg {
  width: 17px;
  height: 17px;
}

.icon-btn .el-icon {
  display: flex;
}

/* ———————————— 响应式 ———————————— */
@media (max-width: 760px) {
  .app-header__inner {
    padding: 0 16px;
  }

  .brand__name {
    display: none;
  }

  .group-btn {
    padding: 0 10px;
    font-size: 13px;
  }

  .group-btn svg {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-col {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-capsule,
  .icon-btn,
  .group-btn,
  .brand {
    transition: none !important;
  }
}
</style>
