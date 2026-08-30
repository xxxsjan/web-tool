<template>
  <div class="mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-2xl font-bold mb-6 text-center">抖音长链提取</h1>

    <div class="mb-4">
      <label for="inputText" class="block text-sm font-medium text-base-content mb-1">输入文本</label>
      <textarea id="inputText" v-model="inputText" class="textarea textarea-bordered w-full" rows="4"
        placeholder="请输入包含抖音链接的文本..." />
    </div>

    <button class="btn btn-primary w-full" :disabled="loading" @click="extractUrl">
      {{ loading ? '提取中…' : '提取抖音链接' }}
    </button>

    <div v-if="hasResult" class="mt-6 space-y-4">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-base-content">提取结果</h2>
        <button type="button" class="btn btn-outline btn-sm" :disabled="!title && !longUrl"
          @click="copyTitleAndLongUrl">
          {{ copyLabel }}
        </button>
      </div>

      <div v-for="item in resultFields" :key="item.key"
        class="rounded-xl border border-base-300 bg-base-200/40 space-y-2">
        <span class="text-sm font-medium text-base-content">{{ item.label }}：</span>
        <span>{{ item.value }}</span>
      </div>
    </div>

    <div v-if="errorMessage" class="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
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
