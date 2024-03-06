<template>
  <div class="home-page">
    <div v-if="welcome" class="text" @click="welcome = false">
      <div class="welcome-text">WelCome</div>
      <h1 class="animate-text">点击进入</h1>
    </div>
    <NavigationList v-else />
    <canvas id="bg" v-if="welcome"></canvas>
  </div>
</template>

<script setup lang="ts">
import NavigationList from './NavigationList.vue';

const welcome = ref(true);
let canvasWidth: number, canvasHeight: number;

function initCanvas() {
  const { width, height } = window.getComputedStyle(
    document.querySelector('.home-page') as HTMLElement
  );
  canvasWidth = parseInt(width);
  canvasHeight = parseInt(height);
  const canvas = document.querySelector('#bg') as HTMLCanvasElement;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  return canvas;
}
let canvas: HTMLCanvasElement, stop: () => void;
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
        '#F9F871'
      ];
      return colorList[Math.floor(Math.random() * colorList.length)];
    }

    return function stop() {
      timer && clearInterval(timer);
      timer = 0;
    };
  }
});
onUnmounted(() => {
  stop && stop();
});
</script>

<style scoped lang="scss">
.home-page {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
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
  .animate-text {
    font-size: 1vw;
    white-space: nowrap;
    animation: animate 3s linear forwards;
  }

  @keyframes animate {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 0.3;
    }
  }
}
</style>
