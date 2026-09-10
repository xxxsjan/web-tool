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
let handleKeyup = null;
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
  html.style.touchAction = 'none';
  body.style.touchAction = 'none';
  // iOS 橡皮筋回弹
  html.style.height = '100%';
  body.style.height = '100%';
  body.style.position = 'fixed';
  body.style.width = '100%';
  body.style.left = '0';
  body.style.top = '0';
}

function unlockViewport() {
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = prevHtmlOverflow;
  body.style.overflow = prevBodyOverflow;
  html.style.overscrollBehavior = prevHtmlOverscroll;
  body.style.overscrollBehavior = prevBodyOverscroll;
  html.style.touchAction = '';
  body.style.touchAction = '';
  html.style.height = '';
  body.style.height = '';
  body.style.position = '';
  body.style.width = '';
  body.style.left = '';
  body.style.top = '';
}

function resize() {
  const { clientWidth, clientHeight } = document.documentElement;
  const isMobile = clientWidth <= 640;
  const padX = isMobile ? 24 : 100;
  const padTop = isMobile ? 48 : 100;
  // 底部留给虚拟键盘，避免「哎哟/你干嘛」钻进键盘区
  const keyboardReserve = isMobile
    ? Math.min(280, Math.round(clientHeight * 0.42))
    : Math.min(220, Math.round(clientHeight * 0.28));
  const padBottom = keyboardReserve + (isMobile ? 12 : 24);

  function randomX() {
    const span = Math.max(1, clientWidth - padX * 2);
    return Math.floor(Math.random() * span) + padX;
  }
  function randomY() {
    const span = Math.max(1, clientHeight - padTop - padBottom);
    return Math.floor(Math.random() * span) + padTop;
  }

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

const keyLabels = {
  a: '啊',
  q: '啊啊',
  e: '哎',
  n: '你',
  t: '太',
  m: 'mei',
  v: '美',
  f: '没',
  c: '唱',
  g: '干',
  j: '鸡',
  x: '鸡叫',
  y: '哟',
  z: '嘛',
  l: '篮球',
  d: '跳',
  k: '坤',
  h: '大家好',
  s: '实在',
  p: '你好烦',
  w: '哇哈嗨',
  o: 'OK',
  u: 'MUSIC',
  r: 'RAP',
  b: 'mum',
  i: '机',
  '1': '你干嘛',
  '2': '厉不厉害',
  '3': '全民制作',
  '4': '练习鲲',
};

/** QWERTY 布局：数字行 + 三行字母 */
const keyboardRows = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const activeKey = ref('');
let audioCount = 0;

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
  setTimeout(remove, 1100);
  container.appendChild(_div);
}

function playKey(rawKey) {
  const key = String(rawKey || '').toLowerCase();
  const src = _map[key];
  if (!src) return false;

  activeKey.value = key;
  createKeyTextDom(key);

  let audio = new Audio(encodeURI(src));
  audio.play().catch(() => {});
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
  return true;
}

function onVirtualKey(key) {
  playKey(key);
  setTimeout(() => {
    if (activeKey.value === key) activeKey.value = '';
  }, 160);
}

function onVirtualKeyPointer(key, event) {
  // 移动端用 pointerdown，避免 300ms 点击延迟与重复触发
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  onVirtualKey(key);
}


onMounted(() => {
  lockViewport();
  resize();
  window.addEventListener('resize', resize);

  const playThrottled = throttle(key => playKey(key), 400);

  handleKeydown = function (event) {
    const key = event.key?.toLowerCase?.() || event.key;
    if (!_map[key]) return;
    event.preventDefault();
    playThrottled(key);
  };

  handleKeyup = function (event) {
    const key = event.key?.toLowerCase?.() || event.key;
    if (activeKey.value === key) activeKey.value = '';
  };

  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('keyup', handleKeyup);
});

onUnmounted(() => {
  unlockViewport();
  if (timer) clearTimeout(timer);
  window.removeEventListener('resize', resize);
  if (handleKeydown) {
    document.removeEventListener('keydown', handleKeydown);
  }
  if (handleKeyup) {
    document.removeEventListener('keyup', handleKeyup);
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

    <div class="keyboard" aria-label="IKUN 键盘">
      <div
        v-for="(row, rowIndex) in keyboardRows"
        :key="rowIndex"
        class="keyboard__row"
        :class="'keyboard__row--' + rowIndex"
      >
        <button
          v-for="key in row"
          :key="key"
          type="button"
          class="kb-key"
          :class="{
            'is-mapped': !!_map[key],
            'is-active': activeKey === key,
          }"
          :disabled="!_map[key]"
          @pointerdown="onVirtualKeyPointer(key, $event)"
        >
          <span class="kb-key__char">{{ key.toUpperCase() }}</span>
          <span v-if="keyLabels[key]" class="kb-key__label">{{ keyLabels[key] }}</span>
        </button>
      </div>
    </div>

    <audio id="audio" src="/ikun/啊.wav"></audio>
  </div>
</template>

<style scoped>
.keyboard-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  max-width: 100vw;
  max-height: 100dvh;
  padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0)
    env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
  box-sizing: border-box;
  background-color: #000;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.keyContainer {
  width: min(28vw, 100px);
  height: min(28vw, 100px);
  color: white;
  font-size: clamp(3.5rem, 18vw, 10em);
  left: 50%;
  top: 38%;
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

#as,
#ngm {
  position: absolute;
  left: 0;
  top: 0;
  font-size: clamp(22px, 6vw, 50px);
  display: inline-block;
  color: #fff;
  opacity: 0;
  visibility: hidden;
  will-change: transform;
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
}

.music_switch {
  position: fixed;
  width: 40px;
  height: 30px;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: calc(14px + env(safe-area-inset-right, 0px));
  cursor: pointer;
  z-index: 30;
  touch-action: manipulation;
}

.keyboard {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 20;
  width: min(860px, calc(100vw - 12px));
  padding: 12px 10px 14px;
  transform: translateX(-50%);
  border-radius: 16px;
  background: linear-gradient(180deg, rgb(40 40 44 / 0.92), rgb(18 18 20 / 0.95));
  border: 1px solid rgb(255 255 255 / 0.12);
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(10px);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.keyboard__row {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
  width: 100%;
}

.keyboard__row:last-child {
  margin-bottom: 0;
}

.keyboard__row--2 {
  padding-left: 18px;
}

.keyboard__row--3 {
  padding-left: 36px;
}

.kb-key {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  max-width: 58px;
  height: 54px;
  padding: 0 2px;
  border-radius: 8px;
  border: 1px solid rgb(255 255 255 / 0.14);
  background: linear-gradient(180deg, #3a3a40, #2a2a30);
  color: rgb(255 255 255 / 0.35);
  box-shadow:
    0 2px 0 rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  cursor: default;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition:
    transform 0.08s ease,
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.kb-key.is-mapped {
  color: #fff;
  cursor: pointer;
  border-color: rgb(255 255 255 / 0.22);
  background: linear-gradient(180deg, #4a4a52, #323238);
}

@media (hover: hover) {
  .kb-key.is-mapped:hover {
    border-color: rgb(96 165 250 / 0.55);
    background: linear-gradient(180deg, #555560, #3a3a44);
  }
}

.kb-key.is-active {
  transform: translateY(2px) scale(0.96);
  border-color: #60a5fa;
  background: linear-gradient(180deg, #2563eb, #1d4ed8);
  box-shadow:
    0 0 0 rgb(0 0 0 / 0),
    inset 0 1px 0 rgb(255 255 255 / 0.2);
}

.kb-key:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.kb-key__char {
  font: 700 13px / 1 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.02em;
}

.kb-key__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  line-height: 1;
  color: rgb(255 255 255 / 0.72);
}

.kb-key.is-active .kb-key__label {
  color: rgb(255 255 255 / 0.92);
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

/* 手机竖屏：更大触控区、收紧错位、适配底部安全区 */
@media (max-width: 640px) {
  .keyboard {
    bottom: 150px;
    width: calc(100vw - 8px);
    padding: 8px 4px calc(8px + env(safe-area-inset-bottom, 0px) * 0.15);
    border-radius: 14px;
  }

  .keyboard__row {
    gap: 3px;
    margin-bottom: 4px;
  }

  .keyboard__row--2 {
    padding-left: 4px;
  }

  .keyboard__row--3 {
    padding-left: 10px;
  }

  .kb-key {
    height: clamp(42px, 11.5vw, 52px);
    max-width: none;
    border-radius: 7px;
    gap: 1px;
  }

  .kb-key__char {
    font-size: clamp(11px, 3.2vw, 13px);
  }

  .kb-key__label {
    font-size: clamp(7px, 2.1vw, 9px);
  }

  .music_switch {
    top: calc(10px + env(safe-area-inset-top, 0px));
    right: calc(12px + env(safe-area-inset-right, 0px));
  }

  .keyContainer {
    top: 32%;
  }
}

/* 矮屏 / 横屏：压缩键盘高度，避免占满屏幕 */
@media (max-height: 500px), (orientation: landscape) and (max-width: 900px) {
  .keyboard {
    bottom: 0;
    padding: 6px 6px 8px;
  }

  .keyboard__row {
    gap: 4px;
    margin-bottom: 3px;
  }

  .keyboard__row--2 {
    padding-left: 12px;
  }

  .keyboard__row--3 {
    padding-left: 24px;
  }

  .kb-key {
    height: 36px;
  }

  .kb-key__label {
    display: none;
  }

  .keyContainer {
    top: 28%;
    font-size: 3rem;
  }

  #as,
  #ngm {
    font-size: 20px;
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
