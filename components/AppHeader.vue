<template>
    <div class="navbar bg-base-100 w-full" v-show="shouldShowBackHomeBtn">
        <!-- <div class="flex-none none" v-show="shouldShowBackHomeBtn">
            <button class="btn btn-square btn-ghost" @click="$router.back()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6">
                    <title>arrow-left</title>
                    <path stroke="currentColor"
                        d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
            </button>
        </div> -->
        <div class="flex-1">
            <a class="btn btn-ghost text-xl" href="/home">
                <el-icon>
                    <House />
                </el-icon>Web Tool</a>
        </div>

        <div class="flex-none m-2 relative flex gap-1 items-center">
            <span>
                {{ finger }}
            </span>
            <div>
                <span class="absolute -top-2 -right-2 flex h-2 w-2">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                <a className="link link-hover" href="https://github.com/xxxsjan" target="_blank">
                    <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32"
                        data-view-component="true" class="octicon octicon-mark-github v-align-middle color-fg-default">
                        <path
                            d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">
                        </path>
                    </svg>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { House } from '@element-plus/icons-vue'
const route = useRoute()

function hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
    }
    return Math.abs(hash);
}
function getFingerprint() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial"';
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillText('hello', 22, 33);

    return hashCode(canvas.toDataURL());
}
const finger = ref('')

const shouldShowBackHomeBtn = computed(() => {
    return route && route.path !== '/';
});
onMounted(() => {
    finger.value = '用户 ' + getFingerprint()
})
</script>