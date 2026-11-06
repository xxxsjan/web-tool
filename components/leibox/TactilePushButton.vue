<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { mountTactilePushButton, type TactilePushButtonOptions } from "./TactilePushButtonEngine.js";
import type { MotionController } from "./motion-runtime";
const props = defineProps<{ options?: TactilePushButtonOptions }>();
const host = ref<HTMLDivElement | null>(null);
let controller: MotionController | undefined;
onMounted(() => { controller = mountTactilePushButton(host.value!, props.options); });
watch(() => props.options, value => controller?.update(value ?? {}), { deep: true });
onBeforeUnmount(() => controller?.destroy());
</script>

<template><div ref="host" data-motion-component="tactile-push-button" /></template>
