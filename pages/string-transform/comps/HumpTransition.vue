<template>
  <div class="space-y-5">
    <div class="space-y-2">
      <label class="text-sm font-medium text-base-content">输入内容</label>
      <input
        v-model="oriVal"
        class="input input-bordered w-full font-mono"
        placeholder="例如：PascalCase 或 kebab-case"
        @keyup.enter="buttons[0]?.action()" />
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        v-for="(btn, i) in buttons"
        :key="i"
        type="button"
        class="btn btn-sm border border-base-300/70 bg-base-200/60 font-normal hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        @click="btn.action">
        {{ btn.label }}
      </button>
    </div>

    <div
      class="rounded-xl border border-base-300/50 bg-base-200/40 px-4 py-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="mb-1 text-xs text-base-content/50">转换结果</p>
          <p class="break-all font-mono text-sm text-primary sm:text-base">
            {{ resultVal || '等待转换…' }}
          </p>
        </div>
        <button
          v-show="resultVal"
          type="button"
          class="btn btn-ghost btn-xs shrink-0 text-primary"
          @click="handleCopy">
          复制
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';

const oriVal = ref('PascalCase');
const resultVal = ref('');

function handleCopy() {
  try {
    navigator.clipboard.writeText(resultVal.value);
    ElMessage({ message: '已复制', type: 'success' });
  } catch (error) {
    ElMessage.error(String(error));
  }
}

function kebabToPascal(str: string) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function pascalToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function kebabToCamel(str: string) {
  return str
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

const buttons = [
  {
    label: '转烤串式',
    action: () => {
      resultVal.value = pascalToKebab(oriVal.value);
    },
  },
  {
    label: '转驼峰',
    action: () => {
      resultVal.value = kebabToCamel(oriVal.value);
    },
  },
  {
    label: '转帕斯卡',
    action: () => {
      resultVal.value = kebabToPascal(oriVal.value);
    },
  },
  {
    label: '驼峰→烤串',
    action: () => {
      resultVal.value = camelToKebab(oriVal.value);
    },
  },
];
</script>
