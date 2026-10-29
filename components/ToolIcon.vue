<script setup lang="ts">
import * as ElementPlusIcons from '@element-plus/icons-vue';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    name?: string;
    size?: number | string;
  }>(),
  {
    name: 'Tools',
    size: undefined,
  },
);

const iconMap = ElementPlusIcons as Record<string, object>;

const icon = computed(() => iconMap[props.name || ''] || iconMap.Tools);
</script>

<template>
  <el-icon :size="size">
    <component :is="icon" />
  </el-icon>
</template>
