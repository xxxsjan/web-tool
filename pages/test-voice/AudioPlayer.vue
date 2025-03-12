<template>
  <div class="audio-player">
    <div class="audio-action">
      <!-- <el-icon size="25" color="#595959" @click="pause" v-if="isPlay"
        ><VideoPause
      /></el-icon> -->
      <!-- <el-icon size="25" color="#595959" @click="play" v-else
        ><VideoPlay
      /></el-icon> -->
    </div>

    <div class="music-wave">
      <div class="box" :class="{ animated: isPlay, paused: isPause }">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// import { VideoPause, VideoPlay } from '@element-plus/icons-vue';
// https://web-tool.dolam.fun/ikun/%E9%B8%A1.wav
const props = defineProps<{ src: string }>();
const audioRef = shallowRef(null);
const isPlay = ref(false);
const isPause = ref(false);
const play = () => {
  if (!audioRef.value) {
    return;
  }
  audioRef.value.play();
};
const pause = () => {
  if (!audioRef.value) {
    return;
  }
  if (audioRef.value.paused) {
    audioRef.value.play();
    isPause.value = false;
  } else {
    audioRef.value.pause();
    isPause.value = true;
  }
};
const audioEnd = () => {
  isPlay.value = false;
  isPause.value = false;
};
const audioPlay = () => {
  isPlay.value = true;
  isPause.value = false;
};
onMounted(() => {
  if (props.src) {
    audioRef.value = new Audio();
    audioRef.value.src = props.src;
    audioRef.value.addEventListener('ended', audioEnd);
    audioRef.value.addEventListener('play', audioPlay);
  }
});
onUnmounted(() => {
  audioRef.value.removeEventListener('ended', audioEnd);
  audioRef.value.removeEventListener('ended', audioPlay);
});
</script>

<style scoped lang="scss">
@use 'sass:list';

.audio-player {
  --height: 45px;
  background-color: transparent;
  // box-shadow: 0 0 5px var(--el-card-border-color);
  color: var(--el-button-text-color);
  border: var(--el-border);
  padding: 10px;
  width: 220px;
  height: var(--height);
  border-radius: calc(var(--height) / 2);
  overflow: hidden;

  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  audio {
    width: 0px;
  }
}

.audio-action {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.music-wave {
  margin: 0 auto;
}

$h: 40px;

.box {
  width: 120px;
  height: $h;
  display: flex;
  justify-content: space-between;
  align-items: center;

  div {
    width: 4px;
    border-radius: 2px;
    background-color: var(--el-color-primary);
    animation-play-state: running;
  }

  &.paused div {
    animation-play-state: paused;
  }
}

$animation-durations: 0.5s 0.8s 0.6s 0.7s 0.7s 0.6s 0.8s 0.5s;

@for $i from 1 through 8 {
  $duration: list.nth($animation-durations, $i);

  .box div:nth-child(#{$i}) {
    height: 0px;
  }

  .box.animated div:nth-child(#{$i}) {
    // animation: musicWave $duration infinite linear both alternate;
    animation-name: musicWave;
    animation-duration: $duration;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-fill-mode: both;
    animation-direction: alternate;
  }
}

@keyframes musicWave {
  0% {
    height: 4px;
  }

  100% {
    height: calc($h / 1.3);
  }
}
</style>
