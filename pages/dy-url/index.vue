<template>
  <div class="dy-url-page mx-auto w-full max-w-[980px] px-3 pb-12 sm:px-4">
    <header class="gh-page-header mb-5 sm:mb-6">
      <h1 class="gh-page-title">抖音长链提取</h1>
      <p class="gh-page-subtitle">粘贴抖音分享口令，自动解析视频信息</p>
    </header>

    <section class="dy-url-panel overflow-hidden rounded-2xl">
      <div class="space-y-4 p-4 sm:p-5">
        <div>
          <label for="inputText" class="mb-1 block text-sm font-medium text-base-content">输入文本</label>
          <textarea id="inputText" v-model="inputText" class="textarea textarea-bordered w-full" rows="4"
            placeholder="请输入包含抖音链接的文本..." />
        </div>

        <button class="btn btn-primary w-full" :disabled="loading" @click="extractUrl">
          {{ loading ? '提取中…' : '提取抖音链接' }}
        </button>
      </div>
    </section>

    <section v-if="hasResult" class="dy-url-panel mt-4 overflow-hidden rounded-2xl">
      <div class="space-y-3 p-4 sm:p-5">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-base-content">提取结果</h2>
          <button type="button" class="btn btn-outline btn-sm" :disabled="!title && !longUrl"
            @click="copyTitleAndLongUrl">
            {{ copyLabel }}
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="item in resultFields" :key="item.key" class="dy-url-field">
            <span class="text-xs font-medium text-base-content/50">{{ item.label }}</span>
            <span class="text-sm text-base-content break-all">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  tool: true,
  title: '抖音转链',
  icon: 'tiktok',
  group: '抖音类',
});

const inputText = ref('');
const shortUrl = ref('');
const longUrl = ref('');
const videoId = ref('');
const videoPageUrl = ref('');
const title = ref('');
const author = ref('');
const tags = ref('');
const errorMessage = ref('');
const loading = ref(false);
const copyLabel = ref('复制标题+长链');

const resultFields = computed(() =>
  [
    { key: 'title', label: '文案', value: title.value },
    { key: 'author', label: '账号', value: author.value },
    { key: 'tags', label: '话题', value: tags.value },
    { key: 'videoId', label: '视频 ID', value: videoId.value },
    { key: 'videoPage', label: '视频页', value: videoPageUrl.value },
    { key: 'short', label: '短链', value: shortUrl.value },
    { key: 'long', label: '长链', value: longUrl.value },
  ].filter(item => item.value),
);

const hasResult = computed(() => resultFields.value.length > 0);

/** 从口令文案解析标题、话题、@账号 */
const parseShareMeta = text => {
  const urlMatch = text.match(/https?:\/\/v\.douyin\.com\/[-\w]+\/?/i);
  let body = text;
  if (urlMatch) {
    body = text.slice(0, urlMatch.index).trim();
  }
  // 去掉口令前缀噪音（如 4.82 m@D.uf 12/22 :2pm hBt:/）
  body = body.replace(/^[\d.\s]*[a-zA-Z0-9@./:\s-]{0,40}?\s+(?=[\u4e00-\u9fff])/u, '').trim();

  const tagList = [...body.matchAll(/#\s*([^\s#@]+)/g)].map(m => m[1].trim()).filter(Boolean);
  const authorMatch = body.match(/@([^\s#]+)/);
  let caption = body
    .replace(/#\s*[^\s#@]+/g, '')
    .replace(/@[^\s#]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: caption,
    author: authorMatch ? authorMatch[1] : '',
    tags: tagList.map(t => `#${t}`).join(' '),
  };
};

/** 从重定向长链解析视频 ID */
const parseVideoId = url => {
  if (!url) return '';
  const patterns = [
    /\/video\/(\d+)/,
    /\/share\/video\/(\d+)/,
    /\/note\/(\d+)/,
    /[?&](?:modal_id|aweme_id|item_ids)=(\d+)/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return '';
};

const resetResult = () => {
  shortUrl.value = '';
  longUrl.value = '';
  videoId.value = '';
  videoPageUrl.value = '';
  title.value = '';
  author.value = '';
  tags.value = '';
  errorMessage.value = '';
  copyLabel.value = '复制标题+长链';
};

const extractUrl = async () => {
  resetResult();

  if (!inputText.value.trim()) {
    errorMessage.value = '请输入文本内容';
    return;
  }

  // 兼容新旧口令：旧版含「】」，新版无，直接抓 v.douyin.com 短链
  const dyUrlRegex = /https?:\/\/v\.douyin\.com\/[-\w]+\/?/i;
  const matches = inputText.value.match(dyUrlRegex);

  if (!matches) {
    errorMessage.value = '未找到抖音链接';
    return;
  }

  const url = matches[0].endsWith('/') ? matches[0] : `${matches[0]}/`;
  const meta = parseShareMeta(inputText.value);
  title.value = meta.title;
  author.value = meta.author;
  tags.value = meta.tags;

  loading.value = true;
  try {
    const { data, error } = await useFetch('/api/test', {
      params: { url },
    });
    if (error.value) throw new Error(error.value.message || 'API请求失败');
    if (!data.value?.data?.url) throw new Error('无效的API响应格式');

    const redirected = data.value.data.url;
    const id = parseVideoId(redirected);

    shortUrl.value = url;
    longUrl.value = redirected.split('?')[0];
    videoId.value = id;
    videoPageUrl.value = id ? `https://www.douyin.com/video/${id}` : '';
  } catch (err) {
    errorMessage.value = err?.message || '提取失败';
  } finally {
    loading.value = false;
  }
};

const copyTitleAndLongUrl = async () => {
  const text = [title.value, longUrl.value].filter(Boolean).join('\n');
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyLabel.value = '已复制!';
    setTimeout(() => {
      copyLabel.value = '复制标题+长链';
    }, 2000);
  } catch {
    errorMessage.value = '复制失败，请手动复制';
  }
};
</script>

<style scoped>
/* ———————————— home 风格 CSS 变量 ———————————— */
.dy-url-page {
  --gh-accent: #3b82f6;
  --gh-accent-soft: rgba(59, 130, 246, 0.18);
  --gh-accent-glow: rgba(96, 165, 250, 0.55);

  --gh-glass-bg: rgba(255, 255, 255, 0.035);
  --gh-glass-bg-hover: rgba(255, 255, 255, 0.07);
  --gh-glass-border: rgba(255, 255, 255, 0.09);
  --gh-glass-border-hover: rgba(96, 165, 250, 0.35);
  --gh-glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --gh-glass-shadow: 0 10px 40px -18px rgba(0, 0, 0, 0.6),
    0 2px 8px -2px rgba(0, 0, 0, 0.4);
  --gh-glass-shadow-hover: 0 18px 50px -12px rgba(14, 165, 233, 0.25),
    0 4px 14px -2px rgba(0, 0, 0, 0.5);
}

:global(html[data-theme='light']) .dy-url-page {
  --gh-accent: #2563eb;
  --gh-accent-soft: rgba(37, 99, 235, 0.15);
  --gh-accent-glow: rgba(59, 130, 246, 0.35);

  --gh-glass-bg: rgba(255, 255, 255, 0.55);
  --gh-glass-bg-hover: rgba(255, 255, 255, 0.8);
  --gh-glass-border: rgba(37, 99, 235, 0.12);
  --gh-glass-border-hover: rgba(59, 130, 246, 0.4);
  --gh-glass-inset: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  --gh-glass-shadow: 0 8px 32px -16px rgba(30, 64, 175, 0.25),
    0 2px 6px -2px rgba(30, 64, 175, 0.1);
  --gh-glass-shadow-hover: 0 16px 48px -12px rgba(37, 99, 235, 0.22),
    0 4px 12px -2px rgba(30, 64, 175, 0.12);
}

/* ———————————— 页面标题 ———————————— */
.gh-page-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 6px;
}

.gh-page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-align: left;
}

.gh-page-subtitle {
  margin: 0;
  font-size: 12px;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  text-align: left;
}

/* ———————————— 玻璃态面板 ———————————— */
.dy-url-panel {
  border: 1px solid var(--gh-glass-border);
  border-radius: 20px;
  background: var(--gh-glass-bg);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
  box-shadow: var(--gh-glass-inset), var(--gh-glass-shadow);
}

/* ———————————— 结果字段 ———————————— */
.dy-url-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--gh-glass-border);
  border-radius: 12px;
  background: var(--gh-glass-bg);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.dy-url-field:hover {
  background: var(--gh-glass-bg-hover);
  border-color: var(--gh-glass-border-hover);
}

/* ———————————— DaisyUI btn 覆盖为玻璃态 ———————————— */
.dy-url-page :deep(.btn) {
  height: 36px;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  border-color: var(--gh-glass-border);
  background: var(--gh-glass-bg);
  color: color-mix(in oklab, var(--color-base-content) 78%, transparent);
  font-size: 14px;
  font-weight: 500;
  box-shadow: none !important;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.dy-url-page :deep(.btn:hover:not(.btn-primary):not(:disabled)) {
  color: var(--gh-accent);
  background: var(--gh-glass-bg-hover);
  border-color: var(--gh-glass-border-hover);
  transform: translateY(-1px);
}

.dy-url-page :deep(.btn-primary) {
  height: 40px;
  min-height: 40px;
  color: #fff;
  border-color: var(--gh-accent-glow);
  background: var(--gh-accent);
}

.dy-url-page :deep(.btn-primary:hover) {
  color: #fff;
  background: color-mix(in oklab, var(--gh-accent) 88%, #fff);
  border-color: var(--gh-accent-glow);
}

.dy-url-page :deep(.btn-outline) {
  border-color: var(--gh-glass-border);
  background: transparent;
}

.dy-url-page :deep(.btn-sm) {
  height: 30px;
  min-height: 30px;
  padding: 0 14px;
  font-size: 13px;
}

/* ———————————— textarea 玻璃态 ———————————— */
.dy-url-page :deep(.textarea) {
  border: 1px solid var(--gh-glass-border);
  border-radius: 12px;
  background: var(--gh-glass-bg);
  color: var(--color-base-content);
  font-size: 14px;
  line-height: 1.55;
  box-shadow: none;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.dy-url-page :deep(.textarea:focus) {
  border-color: var(--gh-glass-border-hover);
  background: var(--gh-glass-bg-hover);
  outline: none;
  box-shadow: 0 0 0 3px var(--gh-accent-soft);
}

@media (max-width: 640px) {
  .gh-page-title {
    font-size: 18px;
  }
}
</style>
