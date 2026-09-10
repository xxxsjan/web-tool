<template>
  <div class="flex flex-col items-center justify-center h-full">
    <ReplayVoice />
  </div>
</template>

<script setup>
definePageMeta({
  tool: true,
  title: '🎤录音测试',
  group: '媒体类',
});

import ReplayVoice from './ReplayVoice.vue';
</script>

<style lang="scss" scoped></style>
