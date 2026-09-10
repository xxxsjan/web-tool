<script setup>
import gsap from 'gsap';

definePageMeta({
  tool: true,
  title: '🐔IKUN键盘',
  group: '娱乐类',
  layout: false,
});


function onClick() { }

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
let handleKeydown = null;
let prevHtmlOverflow = '';
let prevBodyOverflow = '';
let prevHtmlOverscroll = '';
let prevBodyOverscroll = '';

function lockViewport() {
  const html = document.documentElement;
  const body = document.body;
  prevHtmlOverflow = html.style.overflow;
  prevBodyOverflow = body.style.overflow;
  prevHtmlOverscroll = html.style.overscrollBehavior;
  prevBodyOverscroll = body.style.overscrollBehavior;
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  html.style.overscrollBehavior = 'none';
  body.style.overscrollBehavior = 'none';
}

function unlockViewport() {
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = prevHtmlOverflow;
  body.style.overflow = prevBodyOverflow;
  html.style.overscrollBehavior = prevHtmlOverscroll;
  body.style.overscrollBehavior = prevBodyOverscroll;
}

function resize() {
  const { clientWidth, clientHeight } = document.documentElement;
  function randomX() {
    return Math.floor(Math.random() * Math.max(1, clientWidth - 200)) + 100;
  }
  function randomY() {
    return Math.floor(Math.random() * Math.max(1, clientHeight - 200)) + 100;
  }

  // 一进来就随机落点，避免先出现在左上角
  gsap.set('#as', { x: randomX(), y: randomY(), autoAlpha: 1 });
  gsap.set('#ngm', { x: randomX(), y: randomY(), autoAlpha: 1 });

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

const _map = {
  // 原有
  a: '/ikun/啊.wav',
  m: '/ikun/mei.WAV',
  n: '/ikun/你.wav',
  t: '/ikun/太.wav',
  c: '/ikun/唱.wav',
  r: '/ikun/RAP.wav',
  g: '/ikun/干.wav',
  y: '/ikun/哟.wav',
  j: '/ikun/鸡.wav',
  l: '/ikun/篮球.wav',
  // 新增单音 / 短句
  q: '/ikun/啊啊.wav',
  e: '/ikun/哎.wav',
  o: '/ikun/OK.wav',
  u: '/ikun/MUSIC.wav',
  k: '/ikun/坤.wav',
  w: '/ikun/哇哈嗨.wav',
  h: '/ikun/大家好.wav',
  s: '/ikun/实在.wav',
  d: '/ikun/跳.wav',
  f: '/ikun/没.wav',
  i: '/ikun/机.wav',
  z: '/ikun/嘛.wav',
  x: '/ikun/公鸡叫.wav',
  b: '/ikun/mum.wav',
  v: '/ikun/美.wav',
  p: '/ikun/你好烦.wav',
  // 长音频
  '1': '/ikun/你干嘛 哈嗨哟.wav',
  '2': '/ikun/厉不厉害你鲲哥.wav',
  '3': '/ikun/全民制作人民.wav',
  '4': '/ikun/个人练习鲲.wav',
};

const keyHints = [
  ['a', '啊'],
  ['q', '啊啊'],
  ['e', '哎'],
  ['n', '你'],
  ['t', '太'],
  ['m', 'mei'],
  ['v', '美'],
  ['f', '没'],
  ['c', '唱'],
  ['g', '干'],
  ['j', '鸡'],
  ['x', '公鸡叫'],
  ['y', '哟'],
  ['z', '嘛'],
  ['l', '篮球'],
  ['d', '跳'],
  ['k', '坤'],
  ['h', '大家好'],
  ['s', '实在'],
  ['p', '你好烦'],
  ['w', '哇哈嗨'],
  ['o', 'OK'],
  ['u', 'MUSIC'],
  ['r', 'RAP'],
  ['b', 'mum'],
  ['i', '机'],
  ['1', '你干嘛'],
  ['2', '厉不厉害'],
  ['3', '全民制作'],
  ['4', '个人练习鲲'],
];


function createKeyTextDom(text) {
  const container = document.querySelector('.keyContainer');
  if (!container) return;
  const _div = document.createElement('div');
  _div.textContent = text;
  _div.className = 'leave';

  const remove = () => {
    if (_div.parentNode === container) {
      container.removeChild(_div);
    }
  };

  _div.addEventListener('animationend', remove, { once: true });
  // 兜底：scoped/动画异常时仍能移除
  setTimeout(remove, 1100);
  container.appendChild(_div);
}

onMounted(() => {
  lockViewport();
  resize();
  window.addEventListener('resize', resize);

  let audioCount = 0;
  handleKeydown = throttle(function (event) {
    const key = event.key?.toLowerCase?.() || event.key;
    const src = _map[key];
    if (!src) return;

    createKeyTextDom(key);
    let audio = new Audio(encodeURI(src));
    audio.play();
    function handleAudioEnded() {
      audioCount--;
      if (audioCount === 0) {
        document.querySelector('.music_switch')?.classList.remove('active');
      }
      audio.removeEventListener('ended', handleAudioEnded);
      audio = null;
    }
    audio.addEventListener('ended', handleAudioEnded);
    audioCount++;
    document.querySelector('.music_switch')?.classList.add('active');
  }, 400);

  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  unlockViewport();
  if (timer) clearTimeout(timer);
  window.removeEventListener('resize', resize);
  if (handleKeydown) {
    document.removeEventListener('keydown', handleKeydown);
  }
  gsap.killTweensOf('#as');
  gsap.killTweensOf('#ngm');
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
    <div class="keyContainer"></div>
    <div class="key-hint" aria-label="按键说明">
      <div
        v-for="([key, label]) in keyHints"
        :key="key"
        class="key-hint__item"
      >
        <kbd>{{ key }}</kbd>
        <span>{{ label }}</span>
      </div>
    </div>
    <audio id="audio" src="/ikun/啊.wav"></audio>
  </div>
</template>

<style scoped>
.keyboard-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  max-width: 100vw;
  max-height: 100dvh;
  background-color: #000;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
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
  pointer-events: none;
}

#as,
#ngm {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 50px;
  display: inline-block;
  color: #fff;
  opacity: 0;
  visibility: hidden;
  will-change: transform;
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

.key-hint {
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 8px;
  width: min(920px, calc(100vw - 24px));
  max-height: 28vh;
  overflow: auto;
  padding: 10px 12px;
  transform: translateX(-50%);
  border-radius: 12px;
  background: rgb(0 0 0 / 0.55);
  border: 1px solid rgb(255 255 255 / 0.12);
  backdrop-filter: blur(8px);
}

.key-hint__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgb(255 255 255 / 0.78);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.key-hint__item kbd {
  min-width: 18px;
  padding: 2px 5px;
  border-radius: 4px;
  border: 1px solid rgb(255 255 255 / 0.25);
  background: rgb(255 255 255 / 0.08);
  color: #fff;
  font: 600 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  text-align: center;
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

<style>
/* 动态创建的按键字母不受 scoped 影响，需全局样式 */
.keyContainer .leave {
  position: absolute;
  color: #fff;
  animation: ikun-key-leave 1s forwards;
}

@keyframes ikun-key-leave {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-100px);
  }
}
</style>
