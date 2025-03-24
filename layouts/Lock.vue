<template>
    <div class="lock-screen">
        <!-- 时间日期区域 -->
        <div class="time-section">
            <div class="text-8xl font-thin tracking-wide">
                {{ formattedTime }}
            </div>
            <div class="date-section">
                <div class="text-2xl">{{ formattedDate }}</div>
                <div class="text-lg opacity-80">{{ weekDay }}</div>
            </div>
        </div>

        <!-- 解锁提示 -->
        <div class="unlock-hint animate-float">
            <!-- <div class="arrow-down"></div> -->
            <span class="text-sm">操作后解锁</span>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

const now = new Date()

const timeState = reactive({
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
    fullDate: now
})

const formattedTime = computed(() => {
    return `${timeState.hours.toString().padStart(2, '0')}:${timeState.minutes.toString().padStart(2, '0')}:${timeState.seconds.toString().padStart(2, '0')}`
})

const formattedDate = computed(() => {
    return timeState.fullDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
})

const weekDay = computed(() => {
    return timeState.fullDate.toLocaleDateString('zh-CN', { weekday: 'long' })
})

onMounted(() => {
    setInterval(() => {
        const now = new Date()
        timeState.hours = now.getHours()
        timeState.minutes = now.getMinutes()
        timeState.seconds = now.getSeconds()
        timeState.fullDate = now
    }, 1000)
})
</script>

<style scoped>
.lock-screen {
    @apply w-full h-screen flex flex-col items-center justify-between;
    background: linear-gradient(160deg, rgba(0, 0, 0, 0.8) 30%, rgba(50, 50, 50, 0.5));
    backdrop-filter: blur(8px);
    padding: 20vh 0 8vh;
}

.time-section {
    @apply text-white text-center;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    margin-bottom: -0.5rem;
    /* 新增负边距补偿秒数增加的高度 */
}

.date-section {
    @apply mt-6 tracking-wide opacity-90;
    /* 从 mt-4 改为 mt-6 增加上边距 */
}

.unlock-hint {
    @apply text-white flex flex-col items-center gap-2 opacity-90;
}

.arrow-down {
    @apply w-8 h-8 border-2 border-white rounded-full;
    animation: bounce 1.5s infinite;

    &::before {
        content: '↓';
        @apply block text-center -mt-1;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}
</style>