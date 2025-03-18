<template>
    <footer class="footer footer-center p-4 bg-base-300 text-base-content" v-if="!showWelcome">
        <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
                <a href="https://github.com/xxxsjan" target="_blank" class="link link-hover">
                    <i class="eva eva-github-outline text-xl"></i>
                </a>
                <a href="mailto:your@email.com" class="link link-hover">
                    <i class="eva eva-email-outline text-xl"></i>
                </a>
            </div>
            <div class="text-sm opacity-80">
                Copyright © {{ new Date().getFullYear() }} - All rights reserved
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { useHomeStore } from '@/stores/home';
const homeStore = useHomeStore();
const { showWelcome, } = storeToRefs(homeStore);
</script>

<style scoped>
.footer {
    /* position: fixed; */
    /* bottom: 0; */
    width: 100%;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
}
</style>