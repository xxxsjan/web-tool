<template>
  <div>
    <div class="flex justify-center items-center border-2 rounded-xl p-3" @click="showVoice">
      <el-icon>
        <Microphone />
      </el-icon>
      <div class="text-base">开始录音</div>
    </div>


    <dialog id="my_modal_1" class="modal">
      <div class="modal-box">
        <div v-if="isStart">
          <div class="mation mb-10">
            <div class="ap">
              <div class="box">
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
        </div>
        <div class="flex justify-center">
          <AudioPlayer class="mb-10" v-if="!isStart && hasVoice" :src="recordedAudio" />
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <form method="dialog">
            <div class="flex justify-center gap-4 text-center">
              <div v-if="!isStart" class="btn btn-neutral" @click="voice">
                开始录音
              </div>
              <button v-else @click="handleStop" class="btn"> 停止录音 </button>
              <button v-if="!isStart && hasVoice" @click="submit" class="btn">
                发送
              </button>
            </div>
          </form>

        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import Recorder from 'js-audio-recorder';
// import SvgIcon from '~/components/SvgIcon.vue';
import { Microphone } from '@element-plus/icons-vue';

import AudioPlayer from './AudioPlayer.vue';

const showVoice = () => {
  document.getElementById('my_modal_1').showModal()
};
const handleClose = () => {
  handleDestroy();
  document.getElementById('my_modal_1').close()
};

const data = reactive({
  //用于存储创建的语音对象
  recorder: null,
  formData: null,
  // 控制录音动画的显示隐藏
  showAnima: false,
  mation: true,
  isHistory: true,
  // 录音时长
  duration: 0,
  timer: null,
});

const emit = defineEmits(['submit']);

const submit = () => {
  data.recorder.pause();
  data.timer = null;
  var formData = new FormData();
  var blob = data.recorder.getWAVBlob();

  var newbolb = new Blob([blob], { type: 'audio/wav' });
  var fileOfBlob = new File([newbolb], new Date().getTime() + '.wav');
  formData.append('file', fileOfBlob);
  data.duration = Math.ceil((new Date() - data.duration) / 1000);
  console.log(data.duration);
  emit('submit', recordedAudio.value);
  handleClose();

};
let isStart = ref(false);
// 录音按钮的点击事件
const voice = () => {
  //实例化语音对象
  data.recorder = new Recorder({
    sampleBits: 16, // 采样位数，支持 8 或 16，默认是16
    sampleRate: 16000, // 采样率，支持 11025、16000、22050、24000、44100、48000，根据浏览器默认值，我的chrome是48000
    numChannels: 1, // 声道，支持 1 或 2， 默认是1
  });
  //记录开始录音的时间
  data.duration = new Date();
  Recorder.getPermission().then(
    () => {
      console.log('开始录音');
      isStart.value = true;
      data.recorder.start(); // 开始录音
    },
    error => {
      console.log(`${error.name} : ${error.message}`);
    },
  );
};

let hasVoice = ref(false);
let recordedAudio = ref();
const handleStop = () => {
  console.log('停止录音');
  data.recorder.stop(); // 停止录音

  var blob = data.recorder.getWAVBlob();
  var newbolb = new Blob([blob], { type: 'audio/wav' });
  recordedAudio.value = URL.createObjectURL(newbolb);
  data.mation = false;
  isStart.value = false;
  hasVoice.value = true;
};

const handleDestroy = () => {
  if (data.recorder) {
    data.recorder.destroy(); // 毁实例
  }
  isStart.value = false;
  hasVoice.value = false;
};
</script>

<style lang="scss" scoped>
.ap {
  position: relative;
  height: 50px;
  width: 30px;
  margin: 0 auto;
}

$primary-color: pink;

.box div {
  display: inline-block;
  position: absolute;
  bottom: 0;
  width: 4px;
  height: 30px;
  //不喜欢该颜色改成想要的动画颜色
  background-color: $primary-color;
  transform-origin: bottom;
  border-radius: 5px 5px 0 0;
}

.box div:nth-child(1) {
  left: -60px;
  animation: musicWave 0.5s infinite linear both alternate;
}

.box div:nth-child(2) {
  left: -40px;
  animation: musicWave 0.8s infinite linear both alternate;
}

.box div:nth-child(3) {
  left: -20px;
  animation: musicWave 0.6s infinite linear both alternate;
}

.box div:nth-child(4) {
  left: 0px;
  animation: musicWave 0.7s infinite linear both alternate;
}

.box div:nth-child(5) {
  left: 20px;
  animation: musicWave 0.7s infinite linear both alternate;
}

.box div:nth-child(6) {
  left: 40px;
  animation: musicWave 0.6s infinite linear both alternate;
}

.box div:nth-child(7) {
  left: 60px;
  animation: musicWave 0.8s infinite linear both alternate;
}

.box div:nth-child(8) {
  left: 80px;
  animation: musicWave 0.5s infinite linear both alternate;
}

@keyframes musicWave {
  0% {
    height: 8px;
  }

  100% {
    height: 30px;
  }
}

.stop {
  float: left;
  margin-top: 20px;
  margin-left: 50px;
}
</style>
