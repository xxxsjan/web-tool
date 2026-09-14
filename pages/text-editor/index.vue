<template>
  <div
    class="page mx-auto flex w-full max-w-5xl flex-col px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-12"
  >
    <header class="mb-2 shrink-0 text-center sm:mb-6">
      <h1 class="mb-0.5 text-lg font-bold text-base-content sm:mb-1 sm:text-3xl">
        文本编辑
      </h1>
      <p class="text-[11px] text-base-content/50 sm:text-sm">
        本地编辑文本，支持搜索与批量替换
      </p>
    </header>

    <section
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-base-300/60 bg-base-100/90 shadow-lg backdrop-blur-sm sm:rounded-2xl"
    >
      <!-- 工具栏：搜索替换 -->
      <div class="shrink-0 space-y-2 border-b border-base-300/50 px-2.5 py-2 sm:space-y-2.5 sm:px-4 sm:py-3">
        <!-- 查找：输入 + 上下一个（同行，省高度） -->
        <div class="flex items-stretch gap-1.5 sm:gap-2">
          <label class="relative min-w-0 flex-1">
            <span class="sr-only">查找</span>
            <input
              ref="findInputRef"
              v-model="findText"
              type="search"
              enterkeyhint="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              class="find-input input input-bordered w-full"
              placeholder="查找内容…"
              @keydown.enter.exact.prevent="findNext"
              @keydown.enter.shift.prevent="findPrev"
            />
          </label>
          <span
            class="flex min-w-[3.25rem] shrink-0 items-center justify-center rounded-lg bg-base-200 px-1.5 font-mono text-[11px] text-base-content/55 sm:min-w-[3.5rem] sm:text-xs"
          >
            {{ matchStatus || '—' }}
          </span>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 btn-icon"
            :disabled="!findText"
            aria-label="上一个"
            @click="findPrev"
          >
            ↑
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 btn-icon"
            :disabled="!findText"
            aria-label="下一个"
            @click="findNext"
          >
            ↓
          </button>
        </div>

        <!-- 替换：输入 + 操作 -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-stretch sm:gap-2">
          <label class="min-w-0 flex-1">
            <span class="sr-only">替换为</span>
            <input
              v-model="replaceText"
              type="text"
              enterkeyhint="done"
              autocomplete="off"
              class="find-input input input-bordered w-full"
              placeholder="替换为…"
              @keydown.enter.exact.prevent="replaceOne"
            />
          </label>
          <div class="grid grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:shrink-0 sm:gap-2">
            <button
              type="button"
              class="btn btn-ghost border border-base-300 btn-mobile"
              :disabled="!findText || matchCount === 0"
              @click="replaceOne"
            >
              替换
            </button>
            <button
              type="button"
              class="btn btn-primary btn-mobile"
              :disabled="!findText || matchCount === 0"
              @click="replaceAll"
            >
              全部替换
            </button>
          </div>
        </div>

        <!-- 选项 -->
        <div class="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            type="button"
            class="opt-chip"
            :class="{ 'opt-chip--on': caseSensitive }"
            @click="caseSensitive = !caseSensitive"
          >
            区分大小写
          </button>
          <button
            type="button"
            class="opt-chip"
            :class="{ 'opt-chip--on': useRegex }"
            @click="useRegex = !useRegex"
          >
            正则
          </button>
          <button
            type="button"
            class="opt-chip"
            :class="{ 'opt-chip--on': wholeWord, 'opt-chip--disabled': useRegex }"
            :disabled="useRegex"
            @click="wholeWord = !wholeWord"
          >
            全词匹配
          </button>
        </div>

        <p v-if="regexError" class="text-xs text-error">{{ regexError }}</p>
        <p v-else-if="lastAction" class="text-xs text-success">{{ lastAction }}</p>
      </div>

      <!-- 编辑区：占满剩余高度 -->
      <div class="relative min-h-0 flex-1">
        <textarea
          ref="editorRef"
          v-model="content"
          class="editor"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          placeholder="在此粘贴或输入文本…"
          @keydown="onEditorKeydown"
        />
      </div>

      <!-- 底栏 -->
      <div
        class="flex shrink-0 flex-col gap-2 border-t border-base-300/50 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5"
      >
        <div class="font-mono text-[11px] text-base-content/50 sm:text-xs">
          {{ lineCount }} 行 · {{ charCount }} 字
          <template v-if="selectionLength"> · 已选 {{ selectionLength }}</template>
        </div>
        <div class="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5">
          <button
            type="button"
            class="btn btn-ghost border border-base-300 btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="clearContent"
          >
            清空
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="copyContent"
          >
            {{ copyLabel }}
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-base-300 btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="downloadContent"
          >
            下载
          </button>
        </div>
      </div>
    </section>

    <p class="mt-2 hidden shrink-0 text-center text-xs text-base-content/40 sm:mt-3 sm:block">
      快捷键：Ctrl/⌘ + F 聚焦查找 · Enter 下一个 · Shift+Enter 上一个
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  tool: true,
  title: '📝文本编辑',
  group: '工具',
});

const content = ref('');
const findText = ref('');
const replaceText = ref('');
const caseSensitive = ref(false);
const useRegex = ref(false);
const wholeWord = ref(false);
const currentMatchIndex = ref(-1);
const lastAction = ref('');
const copyLabel = ref('复制');
const selectionLength = ref(0);

const editorRef = ref<HTMLTextAreaElement | null>(null);
const findInputRef = ref<HTMLInputElement | null>(null);

const charCount = computed(() => content.value.length);
const lineCount = computed(() => {
  if (!content.value) return 0;
  return content.value.split(/\r\n|\r|\n/).length;
});

const regexError = computed(() => {
  if (!useRegex.value || !findText.value) return '';
  try {
    buildPattern(findText.value);
    return '';
  } catch (e) {
    return e instanceof Error ? e.message : '正则无效';
  }
});

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPattern(raw: string) {
  let source = useRegex.value ? raw : escapeRegExp(raw);
  if (!useRegex.value && wholeWord.value) {
    source = `\\b(?:${source})\\b`;
  }
  const flags = caseSensitive.value ? 'g' : 'gi';
  return new RegExp(source, flags);
}

function collectMatches() {
  if (!findText.value || regexError.value) return [] as { start: number; end: number }[];
  const pattern = buildPattern(findText.value);
  const text = content.value;
  const list: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  pattern.lastIndex = 0;
  while ((m = pattern.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    list.push({ start, end });
    if (m[0].length === 0) pattern.lastIndex += 1;
    if (list.length > 20000) break;
  }
  return list;
}

const matches = computed(() => collectMatches());
const matchCount = computed(() => matches.value.length);

const matchStatus = computed(() => {
  if (!findText.value) return '';
  if (regexError.value) return '错误';
  if (matchCount.value === 0) return '0 处';
  const idx = currentMatchIndex.value;
  if (idx < 0) return `${matchCount.value} 处`;
  return `${idx + 1}/${matchCount.value}`;
});

watch([findText, caseSensitive, useRegex, wholeWord, content], () => {
  currentMatchIndex.value = -1;
  lastAction.value = '';
});

function selectRange(start: number, end: number) {
  const el = editorRef.value;
  if (!el) return;
  el.focus();
  el.setSelectionRange(start, end);
  selectionLength.value = Math.max(0, end - start);

  const before = content.value.slice(0, start);
  const line = before.split(/\r\n|\r|\n/).length;
  const styles = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 22;
  el.scrollTop = Math.max(0, (line - 3) * lineHeight);
}

function jumpToMatch(index: number) {
  const list = matches.value;
  if (!list.length) {
    currentMatchIndex.value = -1;
    return;
  }
  const i = ((index % list.length) + list.length) % list.length;
  currentMatchIndex.value = i;
  const { start, end } = list[i];
  selectRange(start, end);
}

function findNext() {
  if (!findText.value || regexError.value) return;
  const next = currentMatchIndex.value < 0 ? 0 : currentMatchIndex.value + 1;
  jumpToMatch(next);
}

function findPrev() {
  if (!findText.value || regexError.value) return;
  const prev =
    currentMatchIndex.value < 0
      ? matchCount.value - 1
      : currentMatchIndex.value - 1;
  jumpToMatch(prev);
}

function replaceOne() {
  if (!findText.value || regexError.value || !matchCount.value) return;
  const list = matches.value;
  let idx = currentMatchIndex.value;
  if (idx < 0) idx = 0;
  const { start, end } = list[idx];
  const insertion = replaceText.value;
  content.value = content.value.slice(0, start) + insertion + content.value.slice(end);

  nextTick(() => {
    const newEnd = start + insertion.length;
    selectRange(start, newEnd);
    const refreshed = collectMatches();
    if (!refreshed.length) {
      currentMatchIndex.value = -1;
      lastAction.value = '已替换 1 处，无更多匹配';
      return;
    }
    let nextIdx = refreshed.findIndex(m => m.start >= newEnd);
    if (nextIdx < 0) nextIdx = 0;
    currentMatchIndex.value = nextIdx;
    const m = refreshed[nextIdx];
    selectRange(m.start, m.end);
    lastAction.value = '已替换 1 处';
  });
}

function replaceAll() {
  if (!findText.value || regexError.value || !matchCount.value) return;
  const count = matchCount.value;
  try {
    const pattern = buildPattern(findText.value);
    content.value = content.value.replace(pattern, replaceText.value);
    currentMatchIndex.value = -1;
    lastAction.value = `已全部替换 ${count} 处`;
  } catch {
    lastAction.value = '';
  }
}

function clearContent() {
  content.value = '';
  currentMatchIndex.value = -1;
  lastAction.value = '已清空';
  selectionLength.value = 0;
}

async function copyContent() {
  if (!content.value) return;
  try {
    await navigator.clipboard.writeText(content.value);
    copyLabel.value = '已复制';
    setTimeout(() => {
      copyLabel.value = '复制';
    }, 1500);
  } catch {
    copyLabel.value = '失败';
    setTimeout(() => {
      copyLabel.value = '复制';
    }, 1500);
  }
}

function downloadContent() {
  if (!content.value) return;
  const blob = new Blob([content.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `text-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  lastAction.value = '已下载';
}

function onEditorKeydown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    findInputRef.value?.focus();
    findInputRef.value?.select();
  }
}

function syncSelection() {
  const el = editorRef.value;
  if (!el) {
    selectionLength.value = 0;
    return;
  }
  selectionLength.value = Math.abs(el.selectionEnd - el.selectionStart);
}

onMounted(() => {
  const el = editorRef.value;
  if (!el) return;
  el.addEventListener('select', syncSelection);
  el.addEventListener('keyup', syncSelection);
  el.addEventListener('mouseup', syncSelection);
  el.addEventListener('touchend', syncSelection);
});
</script>

<style scoped>
.page {
  -webkit-tap-highlight-color: transparent;
  /* 顶栏约 3.5rem，再留一点余量 */
  min-height: calc(100dvh - 3.75rem);
}

.find-input {
  min-height: 2.75rem;
  font-size: 16px; /* 避免 iOS 聚焦自动放大 */
  line-height: 1.4;
}

@media (min-width: 640px) {
  .find-input {
    min-height: 2rem;
    height: 2rem;
    font-size: 0.875rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

.btn-mobile {
  min-height: 2.75rem;
  height: 2.75rem;
  font-size: 0.875rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.btn-icon {
  min-width: 2.75rem;
  width: 2.75rem;
  min-height: 2.75rem;
  height: 2.75rem;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .btn-mobile {
    min-height: 2rem;
    height: 2rem;
    font-size: 0.875rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .btn-icon {
    min-width: 2rem;
    width: 2rem;
    min-height: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
}

.opt-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 80%, transparent);
  background: transparent;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  font-size: 12px;
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

@media (min-width: 640px) {
  .opt-chip {
    min-height: 2rem;
  }
}

.opt-chip--on {
  border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}

.opt-chip--disabled,
.opt-chip:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.editor {
  display: block;
  width: 100%;
  height: 100%;
  min-height: min(42dvh, 360px);
  max-height: none;
  resize: none;
  border: 0;
  background: color-mix(in oklab, var(--color-base-200) 45%, transparent);
  padding: 12px 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 16px; /* 避免 iOS 聚焦自动放大 */
  line-height: 1.65;
  color: var(--color-base-content);
  outline: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.editor::placeholder {
  color: color-mix(in oklab, var(--color-base-content) 35%, transparent);
}

.editor:focus {
  background: color-mix(in oklab, var(--color-base-200) 65%, transparent);
}

@media (min-width: 640px) {
  .page {
    min-height: auto;
  }

  .editor {
    min-height: min(58vh, 560px);
    height: auto;
    resize: vertical;
    font-size: 13px;
    padding: 14px 16px;
  }
}
</style>
