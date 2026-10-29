<script setup lang="ts">
import { getToolIconSvg } from '~/utils/toolIconSvgs';

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: number | string;
  }>(),
  {
    name: 'toolbox',
    size: '1.25em',
  },
);

const styleSize = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`;
  return String(props.size);
});

const svg = computed(() => getToolIconSvg(props.name));
</script>

<template>
  <span
    class="tool-icon"
    :style="{ width: styleSize, height: styleSize }"
    v-html="svg"
    aria-hidden="true"
  />
</template>

<style scoped>
.tool-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  line-height: 0;
  user-select: none;
  pointer-events: none;
}

.tool-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
</style>
