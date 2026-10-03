<template>
  <div class="mx-auto w-full max-w-4xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        抖音表情包提取
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        粘贴评论区 HTML 或图片链接，提取后打包下载
      </p>
      <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="showTutorial = true"
        >
          使用教程
        </button>
        <a
          v-for="link in convertLinks"
          :key="link.href"
          class="btn btn-ghost btn-sm"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ link.label }}
        </a>
      </div>
    </header>

    <section class="overflow-hidden rounded-2xl tool-panel">
      <div class="space-y-4 p-4 sm:p-5">
        <div>
          <div class="mb-1 flex items-center justify-between gap-2">
            <label
              for="emoji-input"
              class="text-sm font-medium text-base-content"
            >
              输入文本
            </label>
            <span class="text-xs text-base-content/45">
              {{ imageUrls.length }} 张
            </span>
          </div>
          <textarea
            id="emoji-input"
            v-model="inputText"
            class="textarea textarea-bordered w-full min-h-[180px]"
            placeholder="粘贴包含图片链接的文本，或抖音评论区 HTML"
            @keydown.ctrl.enter="handleParse"
            @keydown.meta.enter="handleParse"
          />
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="btn btn-primary flex-1"
            :disabled="!inputText.trim()"
            @click="handleParse"
          >
            解析图片
          </button>
          <button
            type="button"
            class="btn btn-secondary sm:min-w-[9rem]"
            :disabled="!imageUrls.length || downloading"
            @click="handleDownloadAll"
          >
            <span
              v-if="downloading"
              class="loading loading-spinner loading-sm"
            />
            {{ downloading ? `打包中 ${progress}%` : '打包下载' }}
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-app-strong sm:w-24"
            :disabled="downloading || (!inputText && !imageUrls.length)"
            @click="resetAll"
          >
            清空
          </button>
        </div>

        <p
          v-if="errorMessage"
          class="rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
        >
          {{ errorMessage }}
        </p>
      </div>
    </section>

    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl tool-panel p-4">
        <h3 class="mb-3 text-center text-sm font-semibold text-base-content">
          视频评论区
        </h3>
        <textarea
          v-model="videoId"
          rows="3"
          placeholder="粘贴抖音分享口令、短链或视频号"
          class="textarea textarea-bordered textarea-sm mb-2 w-full min-h-[4.5rem] leading-relaxed"
          @keydown.ctrl.enter="goToVideo"
          @keydown.meta.enter="goToVideo"
        />
        <button
          type="button"
          class="btn btn-accent btn-sm w-full"
          :disabled="!videoId.trim() || jumpingVideo"
          @click="goToVideo"
        >
          <span
            v-if="jumpingVideo"
            class="loading loading-spinner loading-xs"
          />
          {{ jumpingVideo ? '解析中…' : '解析跳转' }}
        </button>
        <p
          v-if="jumpError"
          class="mt-2 text-center text-xs text-error"
        >
          {{ jumpError }}
        </p>
        <p v-else class="mt-2 text-center text-xs text-base-content/50">
          分享口令、v.douyin.com 短链、视频页链接均可
        </p>
      </div>
      <div class="rounded-2xl tool-panel p-4">
        <h3 class="mb-3 text-center text-sm font-semibold text-base-content">
          单图下载
        </h3>
        <SingleImageDownloader />
      </div>
    </div>

    <section
      v-if="imageUrls.length"
      class="mt-4 overflow-hidden rounded-2xl tool-panel"
    >
      <div
        class="flex items-center justify-between gap-2 tool-panel-head px-4 py-3"
      >
        <h3 class="text-sm font-semibold text-base-content">提取的图片</h3>
        <span class="text-xs text-base-content/45">
          共 {{ imageUrls.length }} 张 · 右键图片可操作
        </span>
      </div>
      <div class="flex max-h-[520px] flex-wrap content-start gap-3 overflow-auto p-4">
        <div
          v-for="(url, index) in imageUrls"
          :key="`${url}-${index}`"
          class="group relative cursor-pointer"
          @contextmenu.prevent="handleRightClick($event, url)"
        >
          <img
            :src="url"
            :alt="`表情 ${index + 1}`"
            class="h-[100px] w-[100px] rounded-lg border-2 border-transparent object-cover transition hover:border-primary hover:shadow-lg"
            loading="lazy"
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
            @error="handleImageError($event)"
          />
          <span
            v-if="isAnimatedWebp(url)"
            class="absolute bottom-1 right-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-content shadow"
          >
            动
          </span>
          <span
            v-else-if="isStaticWebp(url)"
            class="absolute bottom-1 right-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-content shadow"
          >
            图
          </span>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="showContextMenu"
        class="emoji-ctx fixed z-[80] w-[232px] overflow-hidden rounded-xl border border-app-strong shadow-2xl"
        :style="{ left: `${menuX}px`, top: `${menuY}px` }"
        @mousedown.stop
        @click.stop
      >
        <div class="flex items-center gap-2.5 px-3 py-2.5">
          <img
            :src="currentDownloadUrl"
            alt=""
            class="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-base-content">
              {{ filenameFromUrl(currentDownloadUrl, 0) }}
            </p>
            <p class="mt-0.5 text-[11px] text-base-content/45">
              {{ imageKindLabel }}
            </p>
          </div>
        </div>
        <div class="mx-2 h-px bg-white/8"></div>
        <div class="p-1.5">
          <button
            v-if="!isAnimatedWebp(currentDownloadUrl)"
            type="button"
            class="emoji-ctx-item"
            @click="downloadSingleImage"
          >
            <span class="emoji-ctx-icon">
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0118 9.414V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
            {{ isStaticWebp(currentDownloadUrl) ? '下载为 JPG' : '下载图片' }}
          </button>
          <button type="button" class="emoji-ctx-item" @click="openOriginalImage">
            <span class="emoji-ctx-icon">
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </span>
            查看原图
          </button>
          <button type="button" class="emoji-ctx-item" @click="copyImageUrl">
            <span class="emoji-ctx-icon">
              <svg
                v-if="!urlCopied"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <svg
                v-else
                class="h-4 w-4 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            <span :class="{ 'text-success': urlCopied }">
              {{ urlCopied ? '已复制地址' : '复制图片地址' }}
            </span>
          </button>
        </div>
      </div>
    </Teleport>

    <Model :show="showTutorial" @close="showTutorial = false">
      <img
        src="/tutorial.png"
        alt="使用教程"
        class="mx-auto max-h-[80vh] rounded-lg"
      />
    </Model>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '🎨抖音emoji',
  group: '抖音类',
});

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import SingleImageDownloader from './SingleImageDownloader.vue';
import { convertWebpToJpgAndDownload, copyToClipboard } from './utils';
import domText from './dom';

const STORAGE_KEY = 'cached-emoji-input';
const VIDEO_ID_STORAGE_KEY = 'cached-video-id';
const FAIL_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#3f3f46" width="100" height="100"/><text x="50" y="54" text-anchor="middle" fill="#a1a1aa" font-size="12">加载失败</text></svg>`,
  );

const convertLinks = [
  {
    href: 'https://www.iloveimg.com/zh-cn/convert-to-jpg/webp-to-jpg',
    label: 'WebP → JPG',
  },
  {
    href: 'https://imagetostl.com/cn/convert/file/webp/to/gif',
    label: 'WebP → GIF',
  },
  {
    href: 'https://www.freeconvert.com/zh/webp-to-gif',
    label: 'FreeConvert',
  },
  {
    href: 'https://www.aconvert.com/cn/image/webp-to-gif/',
    label: '可贴 URL 转 GIF',
  },
] as const;

const IMG_TAG_RE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
const DIRECT_URL_RE =
  /https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|gif|awebp|webp)(?:\?[^\s"'<>]*)?/gi;

const inputText = ref(domText);
const imageUrls = ref<string[]>([]);
const showTutorial = ref(false);
const videoId = ref('7582872812784798995');
const showContextMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);
const currentDownloadUrl = ref('');
const downloading = ref(false);
const progress = ref(0);
const errorMessage = ref('');
const jumpError = ref('');
const jumpingVideo = ref(false);
const urlCopied = ref(false);
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

const imageKindLabel = computed(() => {
  if (isAnimatedWebp(currentDownloadUrl.value)) return '动态表情';
  if (isStaticWebp(currentDownloadUrl.value)) return '静态 WebP';
  return '图片';
});

function isAnimatedWebp(url: string) {
  return /\.awebp(\?|$)/i.test(url);
}

function isStaticWebp(url: string) {
  return /\.webp(\?|$)/i.test(url) && !isAnimatedWebp(url);
}

function decodeHtmlUrl(raw: string) {
  return raw
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractImageUrls(text: string) {
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const url = decodeHtmlUrl(raw);
    if (!url || seen.has(url)) return;
    seen.add(url);
    found.push(url);
  };

  for (const match of text.matchAll(IMG_TAG_RE)) {
    if (match[1]) push(match[1]);
  }
  for (const match of text.matchAll(DIRECT_URL_RE)) {
    push(match[0]);
  }
  return found;
}

function filenameFromUrl(url: string, index: number) {
  try {
    const last = new URL(url).pathname.split('/').pop() || '';
    const base = (last.split('~')[0] || last).replace(
      /\.(?:awebp|webp|jpe?g|png|gif)$/i,
      '',
    );
    return base || `image_${index + 1}`;
  } catch {
    return `image_${index + 1}`;
  }
}

function persistInput(value: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore quota */
  }
}

function handleParse() {
  errorMessage.value = '';
  const text = inputText.value.trim();
  if (!text) {
    imageUrls.value = [];
    return;
  }

  persistInput(inputText.value);
  imageUrls.value = extractImageUrls(text);
  if (!imageUrls.value.length) {
    errorMessage.value = '未找到图片链接，请检查粘贴内容';
  }
}

function resetAll() {
  inputText.value = '';
  imageUrls.value = [];
  errorMessage.value = '';
  persistInput('');
}

function extractVideoId(raw: string) {
  const text = raw.trim();
  const fromPath = text.match(/\/(?:video|note|share\/video)\/(\d+)/);
  if (fromPath?.[1]) return fromPath[1];
  if (/^\d{15,}$/.test(text)) return text;
  const digits = text.match(/(?:^|[^\d])(\d{15,})(?:[^\d]|$)/);
  return digits?.[1] || '';
}

function hasShareShortLink(raw: string) {
  return /https?:\/\/v\.douyin\.com\/[-\w]+/i.test(raw);
}

async function resolveShareVideoId(text: string) {
  const data = await $fetch<{ data?: { awemeId?: string } }>(
    '/api/douyin-parse',
    {
      method: 'POST',
      body: { text },
    },
  );
  const id = String(data?.data?.awemeId || '').trim();
  if (!id) throw new Error('未能解析出视频号');
  return id;
}

async function goToVideo() {
  const raw = videoId.value.trim();
  if (!raw || jumpingVideo.value) return;

  jumpError.value = '';
  let id = extractVideoId(raw);

  if (!id && hasShareShortLink(raw)) {
    jumpingVideo.value = true;
    try {
      id = await resolveShareVideoId(raw);
    } catch (err: any) {
      jumpError.value = err?.data?.message || err?.message || '分享口令解析失败';
      jumpingVideo.value = false;
      return;
    }
    jumpingVideo.value = false;
  }

  if (!id) {
    jumpError.value = '请粘贴分享口令、短链或视频号';
    return;
  }

  videoId.value = id;
  window.open(`https://www.douyin.com/video/${id}`, '_blank');
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = FAIL_PLACEHOLDER;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

async function handleDownloadAll() {
  if (!imageUrls.value.length) return;
  downloading.value = true;
  progress.value = 0;
  errorMessage.value = '';

  const zip = new JSZip();
  const total = imageUrls.value.length;
  let done = 0;

  await mapPool(imageUrls.value, 6, async (url, i) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const mimeExt = (blob.type.split('/')[1] || '').split(';')[0];
      const ext =
        mimeExt ||
        (isAnimatedWebp(url) ? 'webp' : url.match(/\.(\w+)(?:\?|$)/)?.[1]) ||
        'png';
      zip.file(`${filenameFromUrl(url, i)}.${ext}`, blob);
    } catch (error) {
      console.error('下载图片失败:', url, error);
    } finally {
      done += 1;
      progress.value = Math.round((done / total) * 100);
    }
  });

  try {
    if (!Object.keys(zip.files).length) {
      throw new Error('没有成功下载到任何图片');
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'douyin-emoji.zip');
  } catch (error: any) {
    errorMessage.value = error?.message || '生成压缩包失败';
  } finally {
    downloading.value = false;
    progress.value = 0;
  }
}

function closeContextMenu() {
  showContextMenu.value = false;
  urlCopied.value = false;
  if (copyResetTimer) clearTimeout(copyResetTimer);
  document.removeEventListener('click', closeContextMenu);
  window.removeEventListener('scroll', closeContextMenu, true);
  window.removeEventListener('keydown', onMenuKeydown);
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeContextMenu();
}

function handleRightClick(event: MouseEvent, url: string) {
  currentDownloadUrl.value = url;
  urlCopied.value = false;
  const pad = 10;
  const menuW = 232;
  const menuH = 220;
  menuX.value = Math.min(
    window.innerWidth - menuW - pad,
    Math.max(pad, event.clientX),
  );
  menuY.value = Math.min(
    window.innerHeight - menuH - pad,
    Math.max(pad, event.clientY),
  );
  showContextMenu.value = true;
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);
    window.addEventListener('keydown', onMenuKeydown);
  }, 0);
}

function openOriginalImage() {
  if (currentDownloadUrl.value) {
    window.open(currentDownloadUrl.value, '_blank');
  }
  closeContextMenu();
}

async function copyImageUrl() {
  if (!currentDownloadUrl.value) return;
  try {
    await copyToClipboard(currentDownloadUrl.value);
    urlCopied.value = true;
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      urlCopied.value = false;
    }, 1600);
  } catch {
    errorMessage.value = '复制失败，请手动复制';
    closeContextMenu();
  }
}

async function downloadSingleImage() {
  const url = currentDownloadUrl.value;
  if (!url) return;

  if (isStaticWebp(url)) {
    convertWebpToJpgAndDownload(url, `${filenameFromUrl(url, 0)}.jpg`);
    closeContextMenu();
    return;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const mimeExt = (blob.type.split('/')[1] || '').split(';')[0] || 'png';
    saveAs(blob, `${filenameFromUrl(url, 0)}.${mimeExt}`);
  } catch (error) {
    console.error('下载失败:', error);
    errorMessage.value = '单图下载失败，请尝试查看原图后另存';
  } finally {
    closeContextMenu();
  }
}

watch(videoId, newValue => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(VIDEO_ID_STORAGE_KEY, newValue);
  } catch {
    /* ignore */
  }
});

watch(inputText, value => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => persistInput(value), 400);
});

onMounted(() => {
  if (typeof localStorage === 'undefined') return;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) inputText.value = cached;
    const cachedVideoId = localStorage.getItem(VIDEO_ID_STORAGE_KEY);
    if (cachedVideoId) videoId.value = cachedVideoId;
  } catch {
    /* ignore */
  }
});

onUnmounted(() => {
  if (persistTimer) clearTimeout(persistTimer);
  if (copyResetTimer) clearTimeout(copyResetTimer);
  closeContextMenu();
});
</script>

<style scoped>
.emoji-ctx {
  background: color-mix(in oklab, var(--color-base-100) 88%, transparent);
  backdrop-filter: blur(16px);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--color-base-content) 6%, transparent) inset,
    0 18px 40px -16px rgb(0 0 0 / 0.55);
  animation: emoji-ctx-in 0.14s ease-out;
}

.emoji-ctx-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.625rem;
  text-align: left;
  font-size: 13px;
  color: var(--color-base-content);
  transition: background-color 0.12s ease;
}

.emoji-ctx-item:hover {
  background: color-mix(in oklab, var(--color-primary) 16%, transparent);
}

.emoji-ctx-icon {
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.45rem;
  background: color-mix(in oklab, var(--color-base-content) 8%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 78%, transparent);
}

@keyframes emoji-ctx-in {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
