<template>
  <div class="mx-auto w-full max-w-3xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        抖音无水印下载
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        粘贴分享口令 → 解析 → 下载视频或音频
      </p>
    </header>

    <section
      class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm"
    >
      <div class="space-y-4 p-4 sm:p-5">
        <div>
          <label for="shareText" class="mb-1 block text-sm font-medium text-base-content">
            抖音口令 / 链接
          </label>
          <textarea
            id="shareText"
            v-model="inputText"
            class="textarea textarea-bordered w-full"
            rows="4"
            placeholder="粘贴抖音分享口令，例如：… https://v.douyin.com/xxxxx/ 复制此链接…"
          />
        </div>

        <div>
          <p class="mb-2 text-sm font-medium text-base-content/70">下载类型</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              :class="
                downloadMode === 'video'
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="loading || downloading"
              @click="downloadMode = 'video'"
            >
              仅视频
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              :class="
                downloadMode === 'audio'
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="loading || downloading"
              @click="downloadMode = 'audio'"
            >
              仅音频
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="btn btn-primary flex-1"
            :disabled="loading || downloading"
            @click="parseShare"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm" />
            {{ loading ? '解析中…' : '解析口令' }}
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 sm:w-28"
            :disabled="loading || downloading || !inputText"
            @click="resetAll"
          >
            清空
          </button>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error"
        >
          {{ errorMessage }}
        </div>
      </div>

      <div
        v-if="result"
        class="space-y-4 border-t border-base-300/50 p-4 sm:p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-lg font-semibold text-base-content">
              {{ result.title }}
            </h2>
            <p v-if="result.author" class="mt-1 text-sm text-base-content/60">
              @{{ result.author }}
            </p>
          </div>
          <span class="badge badge-ghost shrink-0">ID {{ result.awemeId }}</span>
        </div>

        <div
          v-if="result.cover || result.videoUrl"
          class="overflow-hidden rounded-xl border border-base-300/60 bg-neutral"
        >
          <video
            v-if="downloadMode === 'video' && previewVideoUrl"
            :src="previewVideoUrl"
            :poster="result.cover || undefined"
            controls
            playsinline
            class="mx-auto max-h-[320px] w-full object-contain"
          />
          <img
            v-else-if="result.cover"
            :src="result.cover"
            alt="封面"
            class="mx-auto max-h-[320px] w-full object-contain"
          />
        </div>

        <div class="grid gap-2 text-sm sm:grid-cols-2">
          <div class="rounded-lg border border-base-300/60 bg-base-200/40 px-3 py-2">
            <span class="text-base-content/50">视频：</span>
            <span>{{ result.videoUrl ? '已获取无水印地址' : '无' }}</span>
          </div>
          <div class="rounded-lg border border-base-300/60 bg-base-200/40 px-3 py-2">
            <span class="text-base-content/50">音频：</span>
            <span>
              {{
                result.audioUrl
                  ? '已获取原声'
                  : result.videoUrl
                    ? '可从视频提取'
                    : '无'
              }}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="btn btn-primary flex-1"
            :disabled="downloading || !canDownload"
            @click="startDownload"
          >
            <span v-if="downloading" class="loading loading-spinner loading-sm" />
            {{ downloadButtonText }}
          </button>
        </div>

        <div v-if="downloading" class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-base-content/60">{{ downloadStatus }}</span>
          </div>
          <progress class="progress progress-primary w-full" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { saveAs } from 'file-saver';

definePageMeta({
  tool: true,
  title: '🎬抖音无水印下载',
  group: '抖音类',
});

const inputText = ref('');
const downloadMode = ref('video');
const loading = ref(false);
const downloading = ref(false);
const errorMessage = ref('');
const downloadStatus = ref('');
const result = ref(null);

const canDownload = computed(() => {
  if (!result.value) return false;
  if (downloadMode.value === 'video') return Boolean(result.value.videoUrl);
  return Boolean(result.value.audioUrl || result.value.videoUrl);
});

const downloadButtonText = computed(() => {
  if (downloading.value) return '下载中…';
  return downloadMode.value === 'audio' ? '下载音频' : '下载视频';
});

/** 通过代理预览，避免部分 CDN 直链防盗链 */
const previewVideoUrl = computed(() => {
  if (!result.value?.videoUrl) return '';
  const params = new URLSearchParams({
    url: result.value.videoUrl,
    kind: 'video',
    filename: 'preview',
  });
  return `/api/douyin-proxy?${params.toString()}`;
});

const resetAll = () => {
  inputText.value = '';
  result.value = null;
  errorMessage.value = '';
  downloadStatus.value = '';
};

const parseShare = async () => {
  errorMessage.value = '';
  result.value = null;

  if (!inputText.value.trim()) {
    errorMessage.value = '请粘贴抖音分享口令或链接';
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await useFetch('/api/douyin-parse', {
      method: 'POST',
      body: { text: inputText.value.trim() },
    });

    if (error.value) {
      throw new Error(error.value.data?.message || error.value.message || '解析失败');
    }
    if (!data.value?.data) {
      throw new Error('无效的解析结果');
    }

    result.value = data.value.data;

    if (downloadMode.value === 'video' && !result.value.videoUrl) {
      errorMessage.value = '该作品没有可下载视频（可能是图文）';
    }
    if (
      downloadMode.value === 'audio' &&
      !result.value.audioUrl &&
      !result.value.videoUrl
    ) {
      errorMessage.value = '该作品没有可下载音频';
    }
  } catch (err) {
    errorMessage.value = err?.message || '解析失败';
  } finally {
    loading.value = false;
  }
};

const safeFilename = name =>
  String(name || 'douyin')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || 'douyin';

const fetchAsBlob = async (apiUrl, statusText) => {
  downloadStatus.value = statusText;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    let message = `下载失败（${response.status}）`;
    try {
      const json = await response.json();
      if (json?.message) message = json.message;
      else if (json?.statusMessage) message = json.statusMessage;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.blob();
};

const startDownload = async () => {
  if (!result.value || !canDownload.value) return;

  errorMessage.value = '';
  downloading.value = true;

  try {
    const title = safeFilename(result.value.title);
    const author = safeFilename(result.value.author || 'douyin');
    const baseName = `${title}_${author}`.slice(0, 80);

    if (downloadMode.value === 'video') {
      const params = new URLSearchParams({
        url: result.value.videoUrl,
        kind: 'video',
        filename: baseName,
      });
      const blob = await fetchAsBlob(
        `/api/douyin-proxy?${params.toString()}`,
        '正在下载无水印视频…',
      );
      saveAs(blob, `${baseName}.mp4`);
      return;
    }

    // 音频：优先原声，否则从视频提取
    if (result.value.audioUrl) {
      const params = new URLSearchParams({
        url: result.value.audioUrl,
        kind: 'audio',
        filename: baseName,
      });
      const blob = await fetchAsBlob(
        `/api/douyin-proxy?${params.toString()}`,
        '正在下载原声音频…',
      );
      saveAs(blob, `${baseName}.mp3`);
      return;
    }

    const params = new URLSearchParams({
      url: result.value.videoUrl,
      filename: baseName,
    });
    const blob = await fetchAsBlob(
      `/api/douyin-audio?${params.toString()}`,
      '正在从视频提取音频…',
    );
    saveAs(blob, `${baseName}.mp3`);
  } catch (err) {
    errorMessage.value = err?.message || '下载失败';
  } finally {
    downloading.value = false;
    downloadStatus.value = '';
  }
};
</script>
