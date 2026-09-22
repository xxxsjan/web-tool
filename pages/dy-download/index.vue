<template>
  <div class="mx-auto w-full max-w-3xl px-3 pb-12 sm:px-4">
    <header class="mb-5 text-center sm:mb-6">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        抖音无水印下载
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        粘贴分享口令 → 选择画质 → 下载视频或音频
      </p>
    </header>

    <section
      class="overflow-hidden rounded-2xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm"
    >
      <div class="space-y-4 p-4 sm:p-5">
        <div>
          <label
            for="shareText"
            class="mb-1 block text-sm font-medium text-base-content"
          >
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

        <!-- 视频元信息 -->
        <div
          v-if="metaChips.length"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="chip in metaChips"
            :key="chip"
            class="badge badge-outline border-base-300 text-base-content/80"
          >
            {{ chip }}
          </span>
        </div>

        <div
          v-if="result.cover || selectedVideoUrl"
          class="overflow-hidden rounded-xl border border-base-300/60 bg-neutral"
        >
          <video
            v-if="downloadMode === 'video' && previewVideoUrl"
            :key="selectedVideoUrl"
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

        <!-- 画质选择 -->
        <div v-if="downloadMode === 'video' && qualityOptions.length">
          <p class="mb-2 text-sm font-medium text-base-content/70">
            选择画质
          </p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              v-for="item in qualityOptions"
              :key="item.ratio"
              type="button"
              class="btn h-auto min-h-12 flex-col gap-0.5 py-2"
              :class="
                selectedRatio === item.ratio
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="downloading || !item.available"
              @click="selectedRatio = item.ratio"
            >
              <span class="text-sm font-semibold">{{ item.label }}</span>
              <span class="text-[11px] font-normal opacity-80">
                {{ formatSize(item.size) }}
              </span>
            </button>
          </div>
        </div>

        <div class="grid gap-2 text-sm sm:grid-cols-2">
          <div
            class="rounded-lg border border-base-300/60 bg-base-200/40 px-3 py-2"
          >
            <span class="text-base-content/50">当前画质：</span>
            <span>{{ currentQualityLabel }}</span>
          </div>
          <div
            class="rounded-lg border border-base-300/60 bg-base-200/40 px-3 py-2"
          >
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
            <span
              v-if="downloading"
              class="loading loading-spinner loading-sm"
            />
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
const selectedRatio = ref('');

const qualityOptions = computed(() => result.value?.qualities || []);

const selectedQuality = computed(() => {
  const list = qualityOptions.value;
  if (!list.length) return null;
  return (
    list.find(item => item.ratio === selectedRatio.value) || list[0] || null
  );
});

const selectedVideoUrl = computed(() => {
  return (
    selectedQuality.value?.url ||
    result.value?.videoUrl ||
    result.value?.videoUrls?.[0] ||
    ''
  );
});

const currentQualityLabel = computed(() => {
  const q = selectedQuality.value;
  if (!q) return result.value?.videoUrl ? '默认' : '无';
  const sizeText = q.size ? ` · ${formatSize(q.size)}` : '';
  return `${q.label}${sizeText}`;
});

const metaChips = computed(() => {
  if (!result.value) return [];
  const chips = [];
  const { width, height, duration, ratio } = result.value;
  if (width && height) chips.push(`${width}×${height}`);
  if (ratio) chips.push(String(ratio).toUpperCase());
  if (duration) chips.push(formatDuration(duration));
  if (qualityOptions.value.length) {
    chips.push(`${qualityOptions.value.length} 档画质`);
  }
  return chips;
});

const canDownload = computed(() => {
  if (!result.value) return false;
  if (downloadMode.value === 'video') return Boolean(selectedVideoUrl.value);
  return Boolean(result.value.audioUrl || selectedVideoUrl.value);
});

const downloadButtonText = computed(() => {
  if (downloading.value) return '下载中…';
  if (downloadMode.value === 'audio') return '下载音频';
  const label = selectedQuality.value?.label;
  return label ? `下载 ${label}` : '下载视频';
});

/** 通过代理预览，避免部分 CDN 直链防盗链 */
const previewVideoUrl = computed(() => {
  if (!selectedVideoUrl.value) return '';
  const params = new URLSearchParams({
    url: selectedVideoUrl.value,
    kind: 'video',
    filename: 'preview',
  });
  return `/api/douyin-proxy?${params.toString()}`;
});

const formatSize = bytes => {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '体积未知';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDuration = seconds => {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
};

const resetAll = () => {
  inputText.value = '';
  result.value = null;
  selectedRatio.value = '';
  errorMessage.value = '';
  downloadStatus.value = '';
};

const parseShare = async () => {
  errorMessage.value = '';
  result.value = null;
  selectedRatio.value = '';

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
      throw new Error(
        error.value.data?.message || error.value.message || '解析失败',
      );
    }
    if (!data.value?.data) {
      throw new Error('无效的解析结果');
    }

    result.value = data.value.data;
    selectedRatio.value = result.value.qualities?.[0]?.ratio || '';

    if (downloadMode.value === 'video' && !selectedVideoUrl.value) {
      errorMessage.value = '该作品没有可下载视频（可能是图文）';
    }
    if (
      downloadMode.value === 'audio' &&
      !result.value.audioUrl &&
      !selectedVideoUrl.value
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
    const qualityTag = selectedQuality.value?.label
      ? `_${selectedQuality.value.label}`
      : '';
    const baseName = `${title}_${author}${qualityTag}`.slice(0, 80);

    if (downloadMode.value === 'video') {
      const params = new URLSearchParams({
        url: selectedVideoUrl.value,
        kind: 'video',
        filename: baseName,
      });
      const blob = await fetchAsBlob(
        `/api/douyin-proxy?${params.toString()}`,
        `正在下载 ${selectedQuality.value?.label || ''} 无水印视频…`,
      );
      saveAs(blob, `${baseName}.mp4`);
      return;
    }

    // 音频：优先原声，否则从当前画质视频提取
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
      url: selectedVideoUrl.value,
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
