<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-8 sm:px-4 sm:pb-10">
    <header class="pt-1 text-center sm:pt-2">
      <h1 class="mb-1 text-xl font-bold text-base-content sm:text-3xl">
        HTML 在线预览
      </h1>
      <p class="text-xs text-base-content/50 sm:text-sm">
        编辑 HTML / CSS / JS，下方实时预览结果
      </p>
    </header>

    <!-- 编辑区 -->
    <section class="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
      <article class="editor-card">
        <div class="editor-card__head">
          <div class="flex min-w-0 items-center gap-2">
            <span class="badge badge-sm border-0 bg-orange-500/15 font-mono text-orange-600 dark:text-orange-300">
              HTML
            </span>
            <h2 class="truncate text-sm font-semibold text-base-content">结构</h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-base-content/50"
            :disabled="!html"
            @click="html = ''"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="html"
          class="editor-area"
          spellcheck="false"
          placeholder="输入 HTML…"
        />
      </article>

      <article class="editor-card">
        <div class="editor-card__head">
          <div class="flex min-w-0 items-center gap-2">
            <span class="badge badge-sm border-0 bg-sky-500/15 font-mono text-sky-600 dark:text-sky-300">
              CSS
            </span>
            <h2 class="truncate text-sm font-semibold text-base-content">样式</h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-base-content/50"
            :disabled="!styleCode"
            @click="styleCode = ''"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="styleCode"
          class="editor-area"
          spellcheck="false"
          placeholder="输入 CSS…"
        />
      </article>

      <article class="editor-card">
        <div class="editor-card__head">
          <div class="flex min-w-0 items-center gap-2">
            <span class="badge badge-sm border-0 bg-amber-500/15 font-mono text-amber-600 dark:text-amber-300">
              JS
            </span>
            <h2 class="truncate text-sm font-semibold text-base-content">脚本</h2>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-base-content/50"
            :disabled="!scriptCode"
            @click="scriptCode = ''"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="scriptCode"
          class="editor-area"
          spellcheck="false"
          placeholder="输入 JavaScript…"
        />
      </article>
    </section>

    <!-- 预览区 -->
    <section class="preview-card">
      <div class="preview-card__head">
        <div class="flex items-center gap-2">
          <span class="badge badge-primary badge-sm border-0">Preview</span>
          <h2 class="text-sm font-semibold text-base-content">实时预览</h2>
          <span class="hidden text-[11px] text-base-content/40 sm:inline">
            输入后自动更新
          </span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="btn btn-ghost btn-xs border border-base-300"
            @click="resetDemo"
          >
            恢复示例
          </button>
          <button type="button" class="btn btn-primary btn-xs" @click="runPreview">
            刷新预览
          </button>
        </div>
      </div>
      <div class="preview-stage">
        <iframe
          ref="iframeRef"
          title="HTML 预览"
          class="preview-frame"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  tool: true,
  title: '📷在线预览html代码',
  group: '工具',
});

const DEMO_HTML = `<div class="triangle"></div>
<p class="hint">这是一个 CSS 三角形示例</p>`;

const DEMO_CSS = `.triangle {
  width: 0;
  height: 0;
  margin: 40px auto 16px;
  border-style: solid;
  border-width: 120px 120px 0 0;
  border-color: #3b82f6 transparent transparent transparent;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.25));
}

.hint {
  text-align: center;
  color: #64748b;
  font: 14px/1.5 system-ui, sans-serif;
}`;

const DEMO_JS = `// 可在此编写 JS，会在预览文档中执行
console.log('preview ready');`;

const html = ref(DEMO_HTML);
const styleCode = ref(DEMO_CSS);
const scriptCode = ref(DEMO_JS);
const iframeRef = ref<HTMLIFrameElement | null>(null);

function buildDocument(htmlCode: string, cssCode: string, jsCode: string) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body { margin: 0; min-height: 100%; background: #fff; color: #111; }
    ${cssCode}
  </style>
</head>
<body>
${htmlCode}
<script>
${jsCode}
<\/script>
</body>
</html>`;
}

function runPreview() {
  const doc = iframeRef.value?.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(buildDocument(html.value, styleCode.value, scriptCode.value));
  doc.close();
}

function resetDemo() {
  html.value = DEMO_HTML;
  styleCode.value = DEMO_CSS;
  scriptCode.value = DEMO_JS;
  nextTick(runPreview);
}

let timer: ReturnType<typeof setTimeout> | null = null;
watch([html, styleCode, scriptCode], () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(runPreview, 280);
});

onMounted(() => {
  runPreview();
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.editor-card,
.preview-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid color-mix(in oklab, var(--color-base-300) 60%, transparent);
  background: color-mix(in oklab, var(--color-base-100) 90%, transparent);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08);
  backdrop-filter: blur(8px);
}

.editor-card {
  min-height: 220px;
}

@media (min-width: 640px) {
  .editor-card {
    min-height: 260px;
  }
}

.preview-card {
  min-height: 320px;
  flex: 1;
}

@media (min-width: 640px) {
  .preview-card {
    min-height: 420px;
  }
}

.editor-card__head,
.preview-card__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid color-mix(in oklab, var(--color-base-300) 50%, transparent);
  padding: 0.625rem 0.75rem;
}

@media (min-width: 640px) {
  .editor-card__head,
  .preview-card__head {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

.editor-area {
  display: block;
  width: 100%;
  flex: 1;
  min-height: 180px;
  resize: vertical;
  border: 0;
  background: color-mix(in oklab, var(--color-base-200) 55%, transparent);
  padding: 12px 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-base-content);
  outline: none;
}

.editor-area::placeholder {
  color: color-mix(in oklab, var(--color-base-content) 35%, transparent);
}

.editor-area:focus {
  background: color-mix(in oklab, var(--color-base-200) 75%, transparent);
}

.preview-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  background: #fff;
  padding: 0.5rem;
}

@media (min-width: 640px) {
  .preview-stage {
    padding: 0.75rem;
  }
}

.preview-frame {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 280px;
  border-radius: 0.75rem;
  border: 1px solid rgb(0 0 0 / 0.05);
  background: #fff;
}

@media (min-width: 640px) {
  .preview-frame {
    min-height: 360px;
  }
}
</style>
