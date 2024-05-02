<template>
  <div>
    <div class="navbar bg-base-100" v-show="!showWelcome">
      <div class="flex-none" v-show="shouldShowBackHomeBtn">
        <button class="btn btn-square btn-ghost">
          <IconArrowLeft class="w-6" />
        </button>
      </div>
      <div class="flex-1">
        <a class="btn btn-ghost text-xl" href="/">daisyUI</a>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import IconArrowLeft from '@/components/icons/arrow-left.vue';
import { useHomeStore } from '@/stores/home';
const homeStore = useHomeStore();

const { showWelcome } = storeToRefs(homeStore);
const route = useRoute();
const shouldShowBackHomeBtn = computed(() => {
  return route && route.path !== '/';
});
</script>
