<template>
  <div class="home-page min-w-[390px] w-full">
    <div v-if="showWelcome" class="text flex flex-col items-center" @click="showWelcome = false">
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
    <NavigationList2 v-else />
    <canvas id="bg" v-if="showWelcome"></canvas>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useHomeStore } from '@/stores/home';

import NavigationList2 from './NavigationList2.vue';

const homeStore = useHomeStore();

const { showWelcome } = storeToRefs(homeStore);

let canvasWidth: number, canvasHeight: number;

function initCanvas() {
  const { innerWidth, innerHeight } = window;
  // const { width, height } = window.getComputedStyle(
  //   document.querySelector('.home-page') as HTMLElement
  // );
  canvasWidth = parseInt(innerWidth + 'px');
  canvasHeight = parseInt(innerHeight + 'px');
  const canvas = document.querySelector('#bg') as HTMLCanvasElement;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  return canvas;
}
let canvas: HTMLCanvasElement, stop: () => void;

const now = new Date();

const countdownTime = reactive({
  days: 0,
  hours: now.getHours(),
  minutes: now.getMinutes(),
  seconds: now.getSeconds(),
});

onMounted(() => {
  canvas = initCanvas();
  stop = start();
  window.onresize = function () {
    canvas = initCanvas();
    stop && stop();
    stop = start();
  };
  function start() {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const columnWidth = 20;
    const columnCount = Math.floor(canvasWidth / columnWidth);
    console.log('columnCount: ', columnCount);
    // 缓存每一列画到第几行
    const columnNextIndex = new Array(columnCount).fill(1);
    let timer: number = setInterval(() => {
      draw();
    }, 100);
    // 一行一行的画
    // 第一次就是一行行的画
    // 后面由于随机数，他们不在一行了，但是是横向的一批
    function draw() {
      ctx.fillStyle = 'rgba(240,240,240,0.1)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = getRandomColor();
      ctx.font = '20px Consolas';

      for (let i = 0; i < columnCount; i++) {
        const x = i * columnWidth;
        const y = 20 * columnNextIndex[i];
        ctx.fillText(getRandomChar(), x, y);

        if (y > canvasHeight && Math.random() > 0.9) {
          columnNextIndex[i] = 0;
        } else {
          columnNextIndex[i]++;
        }
      }
    }

    function getRandomChar() {
      const str = 'console.log("Hello World")';
      return str[Math.floor(Math.random() * str.length)];
    }

    function getRandomColor() {
      const colorList = [
        '#845EC2',
        '#D65DB1',
        '#FF6F91',
        '#FF9671',
        '#FFC75F',
        '#F9F871',
      ];
      return colorList[Math.floor(Math.random() * colorList.length)];
    }

    return function stop() {
      timer && clearInterval(timer);
      timer = 0;
    };
  }
  setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    countdownTime.hours = hours;
    countdownTime.minutes = minutes;
    countdownTime.seconds = seconds;
  }, 1000);
});
onUnmounted(() => {
  stop && stop();
});
</script>

<style scoped lang="scss">
.home-page {
  // position: absolute;
  // top: 0;
  //left: 0;
  //z-index: -1;
  // width: 100vw;
  // height: 100vh;
  //box-sizing: border-box;
}

.home-page .text {
  position: absolute;
  top: 50%;
  left: 50%;
  text-align: center;
  transform: translate(-50%, -50%);
  user-select: none;

  .welcome-text {
    font-size: 10vw;
  }
}
</style>
