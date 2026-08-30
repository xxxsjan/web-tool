<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div
        class="inline-flex rounded-full border border-base-300/60 bg-base-200/50 p-1">
        <button
          type="button"
          class="mode-btn"
          :class="{ 'mode-btn--active': mode === 'esm' }"
          @click="mode = 'esm'">
          ESM → CJS
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ 'mode-btn--active': mode === 'commonjs' }"
          @click="mode = 'commonjs'">
          CJS → ESM
        </button>
      </div>
      <button class="btn btn-primary btn-sm" @click="run">转换</button>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="space-y-2">
        <label class="text-sm font-medium text-base-content">
          {{ mode === 'esm' ? 'ESM 输入' : 'CommonJS 输入' }}
        </label>
        <textarea
          v-model="code"
          class="textarea textarea-bordered min-h-[220px] w-full resize-y font-mono text-sm leading-relaxed"
          rows="10"
          spellcheck="false" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <label class="text-sm font-medium text-base-content">输出</label>
          <button
            v-if="hasResult"
            type="button"
            class="btn btn-ghost btn-xs text-primary"
            @click="copyResult">
            复制
          </button>
        </div>
        <pre
          class="min-h-[220px] overflow-auto rounded-lg border border-base-300/60 bg-base-200/40 p-3 font-mono text-sm leading-relaxed text-base-content whitespace-pre-wrap break-all">{{ code2 }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';

const esmText = `import path from "path"
import Vue from 'vue';
import {cloneDeep} from "lodash-es"
import json from "./package.json"
`;
const comText = `const path = require("path")
const Vue = require('vue');
const {cloneDeep} = require("lodash-es");
const json = require("./package.json");
`;
const code2DefaultText = '转换结果将显示在这里';

const code = ref(esmText);
const code2 = ref(code2DefaultText);
const mode = ref('esm');

const hasResult = computed(
  () => code2.value && code2.value !== code2DefaultText,
);

watch(mode, (value) => {
  if (value !== 'esm') {
    code.value = comText;
  } else {
    code.value = esmText;
  }
  code2.value = code2DefaultText;
});

const run = () => {
  const code1Text = code.value.split('\n');
  if (mode.value === 'esm') {
    code2.value = code1Text
      .map((item) => {
        const reg = /import\s+(.*?)\s+from\s+["'`]([\w-\/.]+)["'`];?/;
        return item.replace(reg, (...args) => {
          return `const ${args[1]} = require("${args[2]}");`;
        });
      })
      .join('\n');
  } else {
    code2.value = code1Text
      .map((item) => {
        const reg = /const\s+(.*?)\s+=\s+require\(["'`]([\w-\/.]+)["'`]\);?/;
        return item.replace(reg, (...args) => {
          return `import ${args[1]} from "${args[2]}";`;
        });
      })
      .join('\n');
  }
};

async function copyResult() {
  if (!hasResult.value) return;
  try {
    await navigator.clipboard.writeText(code2.value);
    ElMessage.success('已复制');
  } catch {
    ElMessage.error('复制失败');
  }
}
</script>

<style scoped>
.mode-btn {
  border-radius: 9999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: color-mix(in oklab, var(--color-base-content) 65%, transparent);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.mode-btn--active {
  background: color-mix(in oklab, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
}
</style>
