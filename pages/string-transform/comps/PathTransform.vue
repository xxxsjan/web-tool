<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium text-base-content">Windows 路径</label>
      <textarea
        v-model="originVal"
        rows="5"
        class="textarea textarea-bordered w-full resize-y font-mono text-sm leading-relaxed"
        placeholder="例如：D:\hello-word\front-end\project\src"
        @focus="selectAll" />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button class="btn btn-primary btn-sm sm:btn-md" :disabled="!originVal.trim()" @click="toDo">
        转换为正斜杠
      </button>
      <button class="btn btn-ghost btn-sm sm:btn-md" :disabled="!originVal && !result" @click="clearAll">
        清空
      </button>
    </div>

    <div v-if="result" class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <label class="text-sm font-medium text-base-content">转换结果</label>
        <button type="button" class="btn btn-ghost btn-xs gap-1 text-primary" @click="copyResult">
          复制
        </button>
      </div>
      <textarea
        v-model="result"
        rows="4"
        readonly
        class="textarea textarea-bordered w-full resize-y bg-base-200/50 font-mono text-sm leading-relaxed"
        @focus="selectAll" />
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';

const originVal = ref('');
const result = ref('');

function toDo() {
  if (!originVal.value.trim()) return;
  result.value = originVal.value.replace(/\\/g, '/');
}

function clearAll() {
  originVal.value = '';
  result.value = '';
}

async function copyResult() {
  if (!result.value) return;
  try {
    await navigator.clipboard.writeText(result.value);
    ElMessage.success('已复制');
  } catch {
    ElMessage.error('复制失败');
  }
}

function selectAll(e) {
  e.target?.select?.();
}
</script>
