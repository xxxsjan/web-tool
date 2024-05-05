<template>
  <div>
    <div class="navbar bg-base-100 w-full" v-show="!showWelcome">
      <div class="flex-none" v-show="shouldShowBackHomeBtn">
        <button class="btn btn-square btn-ghost" @click="$router.back()">
          <IconArrowLeft class="w-6" />
        </button>
      </div>
      <div class="flex-1">
        <a class="btn btn-ghost text-xl" href="/">Web Tool</a>
      </div>

      <div class="flex-none m-2 relative">
        <div class="tooltip tooltip-left" :data-tip="finger">
          <span class="absolute -top-2 -right-2 flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2 bg-sky-500"
            ></span>
          </span>
          <a
            className="link link-hover"
            href="https://github.com/xxxsjan"
            target="_blank"
          >
            <SvgIcon name="github"></SvgIcon
          ></a>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import IconArrowLeft from '@/components/icons/arrow-left.vue';
import { useHomeStore } from '@/stores/home';
import { getFingerprint } from '@/utils';
const homeStore = useHomeStore();

const finger = getFingerprint();

const { showWelcome } = storeToRefs(homeStore);
const route = useRoute();
const shouldShowBackHomeBtn = computed(() => {
  return route && route.path !== '/';
});
</script>
