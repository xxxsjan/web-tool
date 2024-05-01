<template>
  <div>
    <BackHomeBtn v-show="route.path !== '/'" class="m-4" />
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import BackHomeBtn from '@/components/BackHomeBtn.vue';
const route = useRoute();
</script>
