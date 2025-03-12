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
        <div class="welcome-text">WelCome</div>
        <h1 class="animate-text"></h1>
        <p class="animate-bounce text-xl text-center text-red-500">点击进入</p>
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
</style>