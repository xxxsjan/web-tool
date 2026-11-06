<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { mountDotMatrixTrio, type DotMatrixTrioOptions } from "./DotMatrixTrioEngine.js";
import type { MotionController } from "./motion-runtime";
const props = defineProps<{ options?: DotMatrixTrioOptions }>();
const host = ref<HTMLDivElement | null>(null);
let controller: MotionController | undefined;
onMounted(() => { controller = mountDotMatrixTrio(host.value!, props.options); });
watch(() => props.options, value => controller?.update(value ?? {}), { deep: true });
onBeforeUnmount(() => controller?.destroy());
</script>

<template><div ref="host" data-motion-component="dot-matrix-trio" /></template>
