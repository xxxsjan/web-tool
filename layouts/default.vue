<template>
    <div>
        <AppHeader />
        <slot />
        <!-- <AppFooter /> -->
        <ParticlesJs />
        <!-- <StatsJs v-if="route.path === '/'" /> -->
        <Lock v-if="showLockScreen" @unlock="resetTimer" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <Analytics />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Lock from './Lock.vue'
import { useRoute } from 'nuxt/app'
import { Analytics } from '@vercel/analytics/nuxt';
const route = useRoute()
const showLockScreen = ref(false)
let inactivityTimer = null

// 新增生命周期钩子
onMounted(() => {
    setupEventListeners()
})

onUnmounted(() => {
    removeEventListeners()
})



// 新增事件处理逻辑
const resetTimer = () => {
    showLockScreen.value = false
    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(() => {
        showLockScreen.value = true
    }, 15000)
}

const setupEventListeners = () => {
    ['mousemove', 'keydown', 'click'].forEach(event => {
        window.addEventListener(event, resetTimer)
    })
    resetTimer()
}

const removeEventListeners = () => {
    ['mousemove', 'keydown', 'click'].forEach(event => {
        window.removeEventListener(event, resetTimer)
    })
    clearTimeout(inactivityTimer)
}

// 原有路由监听保持不变
// watch(
//     () => route.path,
//     (newPath) => {
//         if (newPath !== '/' && window?.stats?.domElement) {
//             document.body.removeChild(window.stats.domElement)
//         }
//     }
// )
</script>
