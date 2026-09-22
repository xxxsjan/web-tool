<template>
  <button type="button" class="btn btn-ghost btn-sm border border-base-300" @click="show">
    选择预设
  </button>

  <dialog ref="dialogRef" class="modal" role="dialog">
    <div class="modal-box max-w-3xl">
      <form method="dialog">
        <button
          type="submit"
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          aria-label="关闭"
        >
          ✕
        </button>
      </form>

      <h3 class="mb-1 text-lg font-bold text-base-content">预设片段</h3>
      <p class="mb-4 text-sm text-base-content/50">
        选择一项，自动填入名称、触发词与源代码
      </p>

      <div class="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
        <button
          v-for="(item, index) in demoList"
          :key="index"
          type="button"
          class="flex w-full items-start gap-3 rounded-xl border border-base-300/70 bg-base-200/30 px-3 py-3 text-left transition hover:border-primary/40 hover:bg-base-200/60"
          @click="handleBtn(item)"
        >
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary"
          >
            {{ index + 1 }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium text-base-content">
              {{ item.snippetName }}
            </span>
            <span class="mt-0.5 block text-xs text-base-content/55">
              {{ item.description }}
            </span>
            <span
              class="mt-1.5 inline-flex rounded-md bg-base-300/50 px-1.5 py-0.5 font-mono text-[11px] text-base-content/70"
            >
              {{ item.prefix }}
            </span>
          </span>
          <span class="btn btn-primary btn-xs shrink-0 self-center">使用</span>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">close</button>
    </form>
  </dialog>
</template>

<script setup>
import demoList from './data';

const dialogRef = ref();
const emit = defineEmits(['useCode']);

const handleBtn = row => {
  emit('useCode', row);
  closeDialog();
};

const show = () => {
  dialogRef.value?.showModal();
};

const closeDialog = () => {
  dialogRef.value?.close();
};
</script>
