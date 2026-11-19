<template>
  <div class="welcome-clock">
    <div class="clock-row">
      <div class="clock-cell">
        <span class="clock-value countdown font-mono">
          <span :style="{ '--value': countdownTime.hours }"></span>
        </span>
        <span class="clock-label">HOURS</span>
      </div>

      <span class="clock-colon" aria-hidden="true">:</span>

      <div class="clock-cell">
        <span class="clock-value countdown font-mono">
          <span :style="{ '--value': countdownTime.minutes }"></span>
        </span>
        <span class="clock-label">MINUTES</span>
      </div>

      <span class="clock-colon" aria-hidden="true">:</span>

      <div class="clock-cell">
        <span class="clock-value countdown font-mono">
          <span :style="{ '--value': countdownTime.seconds }"></span>
        </span>
        <span class="clock-label">SECONDS</span>
      </div>
    </div>

    <ClientOnly>
      <!-- home 风格玻璃态进入按钮 -->
      <button class="enter-button" type="button" aria-label="进入工具列表">
        进入
        <svg
          class="enter-button__arrow"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </ClientOnly>

    <p v-if="deployedLabel" class="deploy-meta" title="本次构建写入的部署时间">
      部署于 {{ deployedLabel }}
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

const runtimeConfig = useRuntimeConfig();
const deployedLabel = computed(() => {
  const raw = String(runtimeConfig.public.deployedAt || '');
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
});
</script>

<style scoped>
@import url('~/assets/css/cuIcon.css');

.welcome-clock {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2.75rem, 5.5vw, 4.25rem);
  user-select: none;
}

.clock-row {
  display: flex;
  align-items: center;
  gap: clamp(0.375rem, 1.4vw, 1.25rem);
  /* 给绝对定位的 label 预留空间，避免和下方提示挤在一起 */
  padding-bottom: clamp(1.75rem, 2.6vw, 2.4rem);
}

.clock-cell {
  position: relative;
  display: flex;
  justify-content: center;
  padding: clamp(1.1rem, 3vw, 2.5rem) clamp(0.85rem, 3.2vw, 2.75rem);
  border-radius: clamp(1rem, 2.2vw, 1.75rem);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.02)
  );
  backdrop-filter: blur(16px);
  box-shadow:
    0 30px 70px -30px rgba(0, 0, 0, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.clock-value {
  font-size: clamp(3.25rem, 12vw, 9rem);
  font-weight: 700;
  /* countdown 依赖 line-height: 1em + 子元素 height: 1em，写 0.88 会裁掉字形上下部分 */
  line-height: 1;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 0 48px rgba(255, 255, 255, 0.22);
}

.clock-label {
  position: absolute;
  top: calc(100% + clamp(0.7rem, 1.6vw, 1.1rem));
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: clamp(0.6rem, 0.9vw, 0.8rem);
  font-weight: 500;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.clock-colon {
  font-size: clamp(1.5rem, 5vw, 3.75rem);
  font-weight: 200;
  line-height: 1;
  color: rgba(255, 255, 255, 0.25);
  animation: colon-blink 2s ease-in-out infinite;
}

.enter-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: clamp(42px, 5vw, 52px);
  padding: 0 clamp(24px, 4vw, 36px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.82);
  font-size: clamp(14px, 1.8vw, 16px);
  font-weight: 500;
  letter-spacing: 0.04em;
  font-family: inherit;
  cursor: pointer;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.15s ease;
}

.enter-button:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.enter-button:active {
  transform: translateY(0);
  background: rgba(255, 255, 255, 0.06);
}

.enter-button__arrow {
  width: clamp(14px, 1.8vw, 16px);
  height: clamp(14px, 1.8vw, 16px);
  opacity: 0.7;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.enter-button:hover .enter-button__arrow {
  opacity: 1;
  transform: translateX(3px);
}

.deploy-meta {
  margin: 0;
  font-size: clamp(0.68rem, 1vw, 0.78rem);
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.38);
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.enter-hint__arrow {
  font-size: clamp(0.85rem, 1.2vw, 1rem);
  line-height: 1;
  color: rgba(255, 255, 255, 0.45);
  animation: enter-float 1.6s ease-in-out infinite;
}

@keyframes colon-blink {
  0%,
  100% {
    opacity: 0.25;
  }

  50% {
    opacity: 0.8;
  }
}
</style>
