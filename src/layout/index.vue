<template>
  <div>
    <BackHomeBtn v-show="shouldShowBackHomeBtn" class="m-4" />
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import BackHomeBtn from '@/components/BackHomeBtn.vue';
const route = useRoute();
const shouldShowBackHomeBtn = computed(() => {
  return route && route.path !== '/';
});
</script>
