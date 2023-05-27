<script setup>
import gsap from 'gsap';

function onClick() {}

function throttle(func, delay = 1000) {
  let timerId, flag;
  return function () {
    const context = this;
    const args = arguments;

    if (!timerId) {
      if (!flag) {
        func.apply(context, args);
      }
      flag = true;
      timerId = setTimeout(function run() {
        timerId = null;
        flag = false;
      }, delay);
    }
  };
}
let timer;
function resize() {
  const { clientWidth, clientHeight } = document.documentElement;
  function randomX() {
    return Math.floor(Math.random() * (clientWidth - 100 - 100)) + 100;
  }
  function randomY() {
    return Math.floor(Math.random() * (clientHeight - 100 - 100)) + 100;
  }
  function start() {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      gsap.to('#as', { x: randomX(), y: randomY(), duration: 1 });
      gsap.to('#ngm', { x: randomX(), y: randomY(), duration: 1 });
      start();
    }, 888);
  }
  start();
}

function bindEvent() {
  const ngmDom = document.querySelector('#ngm');
  const audio = document.querySelector('#audio');
  const music_switch = document.querySelector('.music_switch');
  audio.muted = true;
  ngmDom.addEventListener('mouseenter', e => {
    audio.play();
  });
  music_switch.onclick = function () {
    if (audio.muted) {
      audio.muted = false;
      music_switch.classList.add('active');
    } else {
      audio.muted = true;
      music_switch.classList.remove('active');
    }
  };
}
const _map = {
  a: '/ikun/啊.wav',
  m: '/ikun/没.wav',
  n: '/ikun/你.wav',
  t: '/ikun/太.wav',
  c: '/ikun/唱.wav',
  r: '/ikun/RAP.wav',
  g: '/ikun/干.wav',
  y: '/ikun/哟.wav',
  j: '/ikun/鸡.wav'
};
function createKeyTextDom(text) {
  const _div = document.createElement('div');
  _div.innerHTML = text;
  _div.addEventListener('animationend', () => {
    document.querySelector('.keyContainer').removeChild(_div);
  });
  document.querySelector('.keyContainer').appendChild(_div);
  _div.classList.add('leave');
}
onMounted(() => {
  resize();
  // bindEvent();
  window.addEventListener('resize', resize);
  let audioCount = 0;

  const handleKeydown = throttle(function (event) {
    createKeyTextDom(event.key);
    if (Object.keys(_map).includes(event.key)) {
      console.log('event.key: ', event.key);
      // 创建并播放声音
      let sound = new Audio(_map[event.key]);
      sound.play();
      function handleAudioEnded() {
        audioCount--;
        if (audioCount === 0) {
          document.querySelector('.music_switch').classList.remove('active');
        }
        audio.removeEventListener('ended', handleAudioEnded);
        audio = null;
      }
      audio.addEventListener('ended', handleAudioEnded);
      audioCount++;
      document.querySelector('.music_switch').classList.add('active');
    }
  }, 400);
  document.addEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="keyboard-container">
    <div id="as">哎哟</div>
    <div id="ngm" @click="onClick">你干嘛</div>
    <div class="music_switch">
      <span class="s1"></span>
      <span class="s2"></span>
      <span class="s3"></span>
      <span class="s4"></span>
    </div>
    <div class="keyContainer">
      <div class="leave">n</div>
      <div class="leave">n</div>
    </div>
    <audio id="audio" src="./ikun/啊.wav"></audio>
  </div>
</template>

<style>
.keyboard-container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  position: relative;
}

.keyContainer {
  width: 100px;
  height: 100px;
  color: white;
  font-size: 10em;
  left: 50%;
  top: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
}

.leave {
  position: absolute;
  animation-name: leave;
  animation-duration: 1s;
  animation-fill-mode: forwards;
}
@keyframes leave {
  from {
    opacity: 1;
    transform: translateY(0px);
  }
  to {
    opacity: 0;
    transform: translateY(-100px);
  }
}
/* .keyContainer div.leave {
    opacity: 0;
    transform: translateY(-100px);
  } */

#as {
  font-size: 50px;
  display: inline-block;
  color: #fff;
}
#ngm {
  font-size: 50px;
  display: inline-block;
  color: #fff;
}
.music_switch {
  position: fixed;
  width: 40px;
  height: 30px;
  top: 48px;
  right: 62px;
  cursor: pointer;
  z-index: 10;
}
.music_switch span {
  position: absolute;
  width: 4px;
  bottom: 0;
  background: #fff;
}
.music_switch .s1 {
  height: 11px;
  right: 0px;
}
.music_switch .s2 {
  height: 21px;
  right: 10px;
}
.music_switch .s3 {
  height: 28px;
  right: 20px;
}
.music_switch .s4 {
  height: 13px;
  right: 30px;
}
.music_switch.active .s1 {
  animation: wave 0.66s linear infinite;
  -webkit-animation: wave 0.66s linear infinite;
  -ms-animation: wave 0.66s linear infinite;
}
.music_switch.active .s2 {
  animation: wave 0.8s linear infinite;
}
.music_switch.active .s3 {
  animation: wave 0.7s linear infinite;
}
.music_switch.active .s4 {
  animation: wave 0.5s linear infinite;
}
@keyframes wave {
  0% {
    height: 10px;
  }
  50% {
    height: 28px;
  }
  100% {
    height: 10px;
  }
}
</style>
