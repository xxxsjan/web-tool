<template>
  <div
    class="page mx-auto flex w-full max-w-5xl flex-col px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-12"
  >
    <header class="mb-2 shrink-0 text-center sm:mb-6">
      <h1 class="mb-0.5 text-lg font-bold text-base-content sm:mb-1 sm:text-3xl">
        文本编辑
      </h1>
     
    </header>

    <section
      class="overflow-hidden rounded-xl tool-panel sm:rounded-2xl"
    >
      <!-- 工具栏：搜索替换 -->
      <div class="space-y-2 tool-panel-head px-2.5 py-2 sm:space-y-2.5 sm:px-4 sm:py-3">
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
              @keydown.enter.exact.prevent="onFindNext"
              @keydown.enter.shift.prevent="onFindPrev"
            />
          </label>
          <span
            class="flex min-w-[3.25rem] shrink-0 items-center justify-center rounded-lg bg-base-200 px-1.5 font-mono text-[11px] text-base-content/55 sm:min-w-[3.5rem] sm:text-xs"
          >
            {{ matchStatus || '—' }}
          </span>
          <button
            type="button"
            class="btn btn-ghost border border-app-strong btn-icon"
            :disabled="!canSearch"
            aria-label="上一个"
            @click="onFindPrev"
          >
            ↑
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-app-strong btn-icon"
            :disabled="!canSearch"
            aria-label="下一个"
            @click="onFindNext"
          >
            ↓
          </button>
        </div>

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
              @keydown.enter.exact.prevent="onReplaceOne"
            />
          </label>
          <div class="grid grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:shrink-0 sm:gap-2">
            <button
              type="button"
              class="btn btn-ghost border border-app-strong btn-mobile"
              :disabled="!canReplace"
              @click="onReplaceOne"
            >
              替换
            </button>
            <button
              type="button"
              class="btn btn-primary btn-mobile"
              :disabled="!canReplace"
              @click="onReplaceAll"
            >
              全部替换
            </button>
          </div>
        </div>

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

      <!-- 编辑区：固定高度 -->
      <div class="editor-shell">
        <ClientOnly>
          <Codemirror
            v-model="content"
            class="cm-host"
            placeholder="在此粘贴或输入文本…"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
            @ready="onEditorReady"
          />
          <template #fallback>
            <div class="editor-fallback">加载编辑器…</div>
          </template>
        </ClientOnly>
      </div>

      <!-- 底栏 -->
      <div
        class="flex flex-col gap-2 tool-panel-foot px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5"
      >
        <div class="font-mono text-[11px] text-base-content/50 sm:text-xs">
          {{ lineCount }} 行 · {{ charCount }} 字
          <template v-if="selectionLength"> · 已选 {{ selectionLength }}</template>
        </div>
        <div class="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5">
          <button
            type="button"
            class="btn btn-ghost border border-app-strong btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="clearContent"
          >
            清空
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-app-strong btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="copyContent"
          >
            {{ copyLabel }}
          </button>
          <button
            type="button"
            class="btn btn-ghost border border-app-strong btn-mobile sm:btn-xs"
            :disabled="!content"
            @click="downloadContent"
          >
            下载
          </button>
        </div>
      </div>
    </section>

    <p class="mt-2 hidden text-center text-xs text-base-content/40 sm:mt-3 sm:block">
      快捷键：Ctrl/⌘ + F 聚焦查找 · Enter 下一个 · Shift+Enter 上一个 · Enter（替换框）逐个替换
    </p>
  </div>
</template>

<script setup lang="ts">
import { Codemirror } from 'vue-codemirror';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  drawSelection,
  dropCursor,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { EditorState, Prec, RangeSetBuilder, type Extension } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  SearchQuery,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll as cmReplaceAll,
  replaceNext,
  search,
  setSearchQuery,
} from '@codemirror/search';

definePageMeta({
  tool: true,
  title: '📝文本编辑',
  group: '工具',
  ssr: false,
});

const content = ref('');
const findText = ref('');
const replaceText = ref('');
const caseSensitive = ref(false);
const useRegex = ref(false);
const wholeWord = ref(false);
const currentMatchIndex = ref(-1);
const matchCount = ref(0);
const lastAction = ref('');
const copyLabel = ref('复制');
const selectionLength = ref(0);
const regexError = ref('');

const findInputRef = ref<HTMLInputElement | null>(null);
const viewRef = shallowRef<EditorView | null>(null);

const charCount = computed(() => content.value.length);
const lineCount = computed(() => {
  if (!content.value) return 0;
  return content.value.split(/\r\n|\r|\n/).length;
});

const canSearch = computed(
  () => Boolean(findText.value) && !regexError.value && matchCount.value > 0,
);
const canReplace = computed(() => canSearch.value);

const matchStatus = computed(() => {
  if (!findText.value) return '';
  if (regexError.value) return '错误';
  if (matchCount.value === 0) return '0 处';
  if (currentMatchIndex.value < 0) return `${matchCount.value} 处`;
  return `${currentMatchIndex.value + 1}/${matchCount.value}`;
});

const matchMark = Decoration.mark({ class: 'cm-searchMatch' });
const selectedMatchMark = Decoration.mark({
  class: 'cm-searchMatch cm-searchMatch-selected',
});

/**
 * CodeMirror 内置 searchHighlighter 仅在搜索面板打开时渲染高亮。
 * 我们用外部工具栏，所以自行根据 SearchQuery 画装饰。
 */
const alwaysOnSearchHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      const queryChanged = update.transactions.some(tr =>
        tr.effects.some(e => e.is(setSearchQuery)),
      );
      if (
        queryChanged ||
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      const query = getSearchQuery(view.state);
      if (!query.valid) return Decoration.none;

      const builder = new RangeSetBuilder();
      const sel = view.state.selection.main;
      let lastTo = -1;

      for (let i = 0, ranges = view.visibleRanges, len = ranges.length; i < len; i++) {
        let { from, to } = ranges[i];
        while (i < len - 1 && to > ranges[i + 1].from - 500) {
          to = ranges[++i].to;
        }
        const cursor = query.getCursor(view.state, from, to);
        for (let item = cursor.next(); !item.done; item = cursor.next()) {
          const { from: a, to: b } = item.value;
          if (b <= lastTo) continue;
          lastTo = b;
          const selected = sel.from === a && sel.to === b;
          builder.add(a, b, selected ? selectedMatchMark : matchMark);
        }
      }

      return builder.finish();
    }
  },
  { decorations: v => v.decorations },
);

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: 'var(--color-base-content, #111)',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    lineHeight: '1.65',
    overflow: 'auto',
    height: '100%',
  },
  '.cm-content': {
    caretColor: 'transparent', /* 使用 drawSelection 自绘光标 */
    padding: '12px 14px',
    minHeight: '100%',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-cursor, .cm-cursor-primary, .cm-dropCursor': {
    borderLeftColor: 'currentColor',
    borderLeftWidth: '2px',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'currentColor',
  },
  /* VS Code 风格搜索高亮 */
  '.cm-searchMatch': {
    backgroundColor: '#ea5c0055',
    outline: '1px solid #ea5c0088',
    borderRadius: '2px',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: '#00a2db99',
    outline: '1px solid #008cbe',
    borderRadius: '2px',
  },
  '@media (min-width: 640px)': {
    '&': {
      fontSize: '13px',
    },
    '.cm-content': {
      padding: '14px 16px',
    },
  },
});

const extensions: Extension[] = [
  history(),
  drawSelection({ cursorBlinkRate: 1200 }),
  dropCursor(),
  search({ top: true }),
  Prec.high(alwaysOnSearchHighlighter),
  EditorView.lineWrapping,
  keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
    {
      key: 'Mod-f',
      run: () => {
        findInputRef.value?.focus();
        findInputRef.value?.select();
        return true;
      },
      preventDefault: true,
    },
    {
      key: 'F3',
      run: view => findNext(view),
    },
    {
      key: 'Shift-F3',
      run: view => findPrevious(view),
    },
  ]),
  editorTheme,
  EditorView.updateListener.of(update => {
    if (update.selectionSet || update.docChanged) {
      syncSelectionAndMatches(update.view);
    }
  }),
  EditorState.tabSize.of(2),
];

function buildQuery() {
  return new SearchQuery({
    search: findText.value,
    caseSensitive: caseSensitive.value,
    regexp: useRegex.value,
    wholeWord: !useRegex.value && wholeWord.value,
    replace: replaceText.value,
    literal: true,
  });
}

function applySearchQuery(view = viewRef.value) {
  if (!view) return;
  const query = buildQuery();
  regexError.value = '';
  if (findText.value && useRegex.value && !query.valid) {
    regexError.value = '正则无效';
  }
  view.dispatch({ effects: setSearchQuery.of(query) });
  refreshMatchInfo(view);
}

function collectMatchRanges(view: EditorView) {
  const query = getSearchQuery(view.state);
  if (!query.valid || !findText.value) return [] as { from: number; to: number }[];
  const ranges: { from: number; to: number }[] = [];
  const cursor = query.getCursor(view.state);
  for (let item = cursor.next(); !item.done; item = cursor.next()) {
    ranges.push(item.value);
    if (ranges.length > 20000) break;
  }
  return ranges;
}

function refreshMatchInfo(view: EditorView) {
  if (regexError.value || !findText.value) {
    matchCount.value = 0;
    currentMatchIndex.value = -1;
    return;
  }
  const ranges = collectMatchRanges(view);
  matchCount.value = ranges.length;
  const sel = view.state.selection.main;
  const idx = ranges.findIndex(r => r.from === sel.from && r.to === sel.to);
  currentMatchIndex.value = idx;
}

function syncSelectionAndMatches(view: EditorView) {
  const sel = view.state.selection.main;
  selectionLength.value = Math.abs(sel.to - sel.from);
  if (findText.value) refreshMatchInfo(view);
}

function onEditorReady(payload: { view: EditorView }) {
  viewRef.value = payload.view;
  applySearchQuery(payload.view);
  requestAnimationFrame(() => payload.view.focus());
}

watch([findText, caseSensitive, useRegex, wholeWord, replaceText], () => {
  lastAction.value = '';
  applySearchQuery();
});

function onFindNext() {
  const view = viewRef.value;
  if (!view || !findText.value || regexError.value) return;
  applySearchQuery(view);
  findNext(view);
  refreshMatchInfo(view);
  lastAction.value = '';
}

function onFindPrev() {
  const view = viewRef.value;
  if (!view || !findText.value || regexError.value) return;
  applySearchQuery(view);
  findPrevious(view);
  refreshMatchInfo(view);
  lastAction.value = '';
}

function onReplaceOne() {
  const view = viewRef.value;
  if (!view || !canReplace.value) return;
  applySearchQuery(view);
  const before = matchCount.value;
  const ranges = collectMatchRanges(view);
  const sel = view.state.selection.main;
  const onMatch = ranges.some(r => r.from === sel.from && r.to === sel.to);
  if (!onMatch) {
    findNext(view);
  }
  replaceNext(view);
  refreshMatchInfo(view);
  if (matchCount.value === 0) {
    lastAction.value = before > 0 ? '已替换 1 处，无更多匹配' : '';
  } else {
    lastAction.value = '已替换 1 处';
  }
}

function onReplaceAll() {
  const view = viewRef.value;
  if (!view || !canReplace.value) return;
  applySearchQuery(view);
  const count = matchCount.value;
  cmReplaceAll(view);
  refreshMatchInfo(view);
  lastAction.value = `已全部替换 ${count} 处`;
}

function clearContent() {
  content.value = '';
  currentMatchIndex.value = -1;
  matchCount.value = 0;
  lastAction.value = '已清空';
  selectionLength.value = 0;
  nextTick(() => applySearchQuery());
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
</script>

<style scoped>
.page {
  -webkit-tap-highlight-color: transparent;
}

.find-input {
  min-height: 2.75rem;
  font-size: 16px;
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
  border: 1px solid var(--app-border-strong);
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

.editor-shell {
  height: 420px;
  overflow: hidden;
  background: color-mix(in oklab, var(--color-base-200) 45%, transparent);
}

.editor-shell:focus-within {
  background: color-mix(in oklab, var(--color-base-200) 65%, transparent);
}

.cm-host {
  display: block;
  width: 100%;
  height: 100%;
}

.cm-host :deep(.cm-editor) {
  height: 100%;
  background: transparent;
}

.cm-host :deep(.cm-cursor),
.cm-host :deep(.cm-cursor-primary) {
  border-left: 2px solid currentColor !important;
  margin-left: -1px;
  pointer-events: none;
}

.cm-host :deep(.cm-editor.cm-focused) {
  outline: none;
}

/* 兜底确保高亮可见（部分主题/预检可能压低 mark 背景） */
.cm-host :deep(.cm-searchMatch) {
  background-color: #ea5c0055 !important;
  outline: 1px solid #ea5c0088;
  border-radius: 2px;
}

.cm-host :deep(.cm-searchMatch-selected) {
  background-color: #00a2db99 !important;
  outline: 1px solid #008cbe;
}

.editor-fallback {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
  font-size: 0.875rem;
}

@media (min-width: 640px) {
  .editor-shell {
    height: 520px;
  }
}
</style>
