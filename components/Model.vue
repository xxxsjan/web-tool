<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="relative max-w-3xl rounded-2xl border border-app-strong bg-base-100 p-4 shadow-xl sm:p-6"
    >
      <button
        type="button"
        class="btn btn-sm btn-circle btn-ghost absolute -top-3 -right-3 border border-app-strong bg-base-100"
        aria-label="关闭"
        @click="$emit('close')"
      >
        ✕
      </button>
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  props: ['show'],
  emits: ['close'],
};
</script>
