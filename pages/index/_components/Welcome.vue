<template>
    <div class="text flex flex-col items-center">
        <div class="grid grid-flow-col gap-5 text-center auto-cols-max">
            <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span class="countdown font-mono text-5xl">
                    <span :style="{ '--value': countdownTime.hours }"></span>
                </span>
                hours
            </div>

            <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span class="countdown font-mono text-5xl">
                    <span :style="{ '--value': countdownTime.minutes }"></span>
                </span>
                min
            </div>
            <div class="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
                <span class="countdown font-mono text-5xl">
                    <span :style="{ '--value': countdownTime.seconds }"></span>
                </span>
                sec
            </div>
        </div>
        <p class="enter-hint">
            <span class="enter-hint__text">点击进入</span>
            <span class="enter-hint__arrow" aria-hidden="true">↓</span>
        </p>
    </div>

</template>

<script setup>
// import '~/assets/css/cuIcon.css'

const now = new Date();

const countdownTime = reactive({
    days: 0,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
});
onMounted(() => {
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        countdownTime.hours = hours;
        countdownTime.minutes = minutes;
        countdownTime.seconds = seconds;
    }, 1000);
})

</script>

<style scoped>
@import url('~/assets/css/cuIcon.css');

.text {
    position: absolute;
    top: 50%;
    left: 50%;
    text-align: center;
    transform: translate(-50%, -50%);
    user-select: none;
}

.welcome-text {
    font-size: 10vw;
}

.enter-hint {
    margin-top: 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
}

.enter-hint__text {
    font-size: 0.95rem;
    letter-spacing: 0.45em;
    text-indent: 0.45em;
    color: rgba(255, 255, 255, 0.72);
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
    animation: enter-fade 2.4s ease-in-out infinite;
}

.enter-hint__arrow {
    font-size: 0.85rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.45);
    animation: enter-float 1.6s ease-in-out infinite;
}

@keyframes enter-fade {
    0%,
    100% {
        opacity: 0.55;
    }

    50% {
        opacity: 1;
    }
}

@keyframes enter-float {
    0%,
    100% {
        transform: translateY(0);
        opacity: 0.35;
    }

    50% {
        transform: translateY(6px);
        opacity: 0.8;
    }
}
</style>