<template>
  <div class="home-page min-w-[390px] w-full">
    <Welcome @click="toHome"></Welcome>
    <CanvasBg></CanvasBg>
  </div>
</template>

<script setup lang="ts">
import Welcome from './_components/Welcome.vue';
import CanvasBg from './_components/CanvasBg.vue';
import { useRouter } from 'nuxt/app';

const router = useRouter();
const toHome = () => {
  stop && stop();
  router.push('/home');
};
</script>

<style lang="scss"></style>
