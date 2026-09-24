<template>
  <div class="relative z-[100] max-w-full">
    <div
      v-show="shouldShowBackHomeBtn"
      class="navbar relative z-[100] max-w-full overflow-visible bg-transparent w-full gap-1 px-2 sm:px-3"
    >
      <div class="flex-none">
        <a class="btn btn-ghost text-xl px-2" href="/home">
          <el-icon>
            <House />
          </el-icon>
          <span class="hidden sm:inline">Tool</span>
        </a>
      </div>

      <!-- 分组名横排；悬停展开子工具；点击子项后收起 -->
      <nav
        class="flex-1 min-w-0 overflow-visible"
        aria-label="工具分组导航"
      >
        <div class="flex flex-wrap items-center gap-0.5 py-1">
          <div
            v-for="group in groupedTools"
            :key="group.group"
            class="relative shrink-0"
            @mouseenter="onGroupEnter(group.group)"
            @mouseleave="onGroupLeave"
          >
            <button
              type="button"
              class="btn btn-ghost btn-md h-11 gap-1.5 px-3.5 text-base font-medium"
              :class="{
                'btn-active bg-base-200':
                  isGroupActive(group) || openGroup === group.group,
              }"
            >
              {{ group.group }}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 opacity-50 transition-transform"
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
              <div
                class="rounded-xl border border-app bg-base-100/95 p-1.5 shadow-xl backdrop-blur-sm"
              >
                <button
                  v-for="item in group.list"
                  :key="item.path"
                  type="button"
                  class="btn btn-ghost btn-md h-10 w-full justify-start gap-2.5 px-2.5 text-base font-normal"
                  :class="{
                    'btn-active bg-base-200': route.path === item.path,
                  }"
                  @click="onSelectTool(item.path)"
                >
                  <span class="w-6 shrink-0 text-center text-lg leading-none">
                    {{ item.icon }}
                  </span>
                  <span class="truncate">{{ item.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="flex-none relative z-[100] flex gap-1 sm:gap-2 items-center">
        <span
          class="hidden lg:inline text-xs text-base-content/50 max-w-[7rem] truncate"
          :title="finger"
        >
          {{ finger }}
        </span>

        <button
          type="button"
          class="btn btn-ghost btn-circle"
          :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'"
          :title="isDark ? '切换到亮色' : '切换到暗色'"
          @click="toggleTheme"
        >
          <el-icon :size="20">
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
            class="link link-hover"
            href="https://github.com/xxxsjan"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <svg
              height="28"
              aria-hidden="true"
              viewBox="0 0 16 16"
              version="1.1"
              width="28"
              class="octicon octicon-mark-github v-align-middle fill-current"
            >
              <path
                d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- 欢迎页无导航栏时仍可切换主题 -->
    <button
      v-show="!shouldShowBackHomeBtn"
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
  </div>
</template>

<script setup>
import { House, Moon, Sunny } from '@element-plus/icons-vue';
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

const onGroupEnter = name => {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = 0;
  }
  if (locked.value) return;
  openGroup.value = name;
};

const onGroupLeave = () => {
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = window.setTimeout(() => {
    openGroup.value = '';
    locked.value = false;
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
  await goTool(path);
};

onUnmounted(() => {
  if (leaveTimer) clearTimeout(leaveTimer);
});

function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return Math.abs(hash);
}
function getFingerprint() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillText('hello', 22, 33);

  return hashCode(canvas.toDataURL());
}
const finger = ref('');

const shouldShowBackHomeBtn = computed(() => {
  return route && route.path !== '/';
});
onMounted(() => {
  finger.value = '用户 ' + getFingerprint();
});
</script>
