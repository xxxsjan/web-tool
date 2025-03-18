<template>
    <div>
        <AppHeader />
        <slot />
        <!-- <AppFooter /> -->
        <ParticlesJs />
        <StatsJs v-if="route.path === '/'" />
    </div>
</template>

<script setup>
import { useRoute } from 'nuxt/app';
const route = useRoute();

// 监听路由路径
watch(
    () => route.path,
    (newPath, oldPath) => {
        if (newPath !== '/') {
            // 路由路径不为 '/' 时执行的操作
            if (window?.stats?.domElement) {
                document.body.removeChild(window.stats.domElement)
            }
        }
    })
</script>
