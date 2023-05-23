<template>
  <div
    class="string-transform flex flex-col justify-center items-center gap-10"
  >
    <PathTransform />
    <HumpTransition />
  </div>
</template>

<script lang="ts" setup>
import PathTransform from './comps/PathTransform.vue';
import HumpTransition from './comps/HumpTransition.vue';
</script>
