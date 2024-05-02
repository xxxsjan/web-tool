<template>
  <div
    class="flex flex-col justify-center items-center lg:flex-row lg:items-start gap-5"
  >
    <div class="left">
      <div class="bg-container flex justify-center items-center">
        <!-- 像素背景 -->
        <div class="px-bg"></div>
        <!-- 遮罩 -->
        <div class="mask-bg"></div>

        <div v-loading="loading" class="mb-2 absolute" v-if="!imgBaseUrl">
          <input
            type="file"
            @change="fileChange"
            accept=".png,.jpg,.jpeg"
            class="file-input w-full max-w-xs"
          />
        </div>

        <div class="preview-container">
          <img :src="imgBaseUrl" alt="" class="preview-img" />
          <!-- 裁剪容器 -->
          <div
            class="cut-wrapper"
            style="
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
            "
          >
            <!-- 裁剪区 -->
            <div
              class="cropper-crop-box"
              :style="{
                width: moveElWidth + 'px',
                height: moveElHeight + 'px',
                transform: `translate3d(${translateX}px, ${translateY}px, 0px)`,
              }"
              v-if="imgBaseUrl"
            >
              <!-- 移动板  -->
              <span
                class="cropper-face"
                @mousedown="handleMoveEl"
                @touchstart="handleMoveEl"
              ></span>
              <!-- 尺寸信息 -->
              <span class="crop-info" style="bottom: -21px"
                >{{ parseInt(moveElWidth) }} ×
                {{ parseInt(moveElHeight) }}</span
              >
              <!-- 框 -->
              <span
                ><span
                  class="crop-line line-n"
                  @mousedown="handleLineDown($event, 'n')"
                  @touchstart="handleLineDown($event, 'n')"
                ></span
                ><span
                  class="crop-line line-w"
                  @mousedown="handleLineDown($event, 'w')"
                  @touchstart="handleLineDown($event, 'w')"
                ></span
                ><span
                  class="crop-line line-s"
                  @mousedown="handleLineDown($event, 's')"
                  @touchstart="handleLineDown($event, 's')"
                ></span
                ><span
                  class="crop-line line-e"
                  @mousedown="handleLineDown($event, 'e')"
                  @touchstart="handleLineDown($event, 'e')"
                ></span
                ><span
                  class="crop-point point1 nw"
                  @mousedown="handleLineDown($event, 'nw')"
                  @touchstart="handleLineDown($event, 'nw')"
                ></span
                ><span
                  class="crop-point point2 n"
                  @mousedown="handleLineDown($event, 'n')"
                  @touchstart="handleLineDown($event, 'n')"
                ></span
                ><span
                  class="crop-point point3 ne"
                  @mousedown="handleLineDown($event, 'ne')"
                  @touchstart="handleLineDown($event, 'ne')"
                ></span
                ><span
                  class="crop-point point4 w"
                  @mousedown="handleLineDown($event, 'w')"
                  @touchstart="handleLineDown($event, 'w')"
                ></span
                ><span
                  class="crop-point point5 e"
                  @mousedown="handleLineDown($event, 'e')"
                  @touchstart="handleLineDown($event, 'e')"
                ></span
                ><span
                  class="crop-point point6 sw"
                  @mousedown="handleLineDown($event, 'sw')"
                  @touchstart="handleLineDown($event, 'sw')"
                ></span
                ><span
                  class="crop-point point7 s"
                  @mousedown="handleLineDown($event, 's')"
                  @touchstart="handleLineDown($event, 's')"
                ></span
                ><span
                  class="crop-point point8 se"
                  @mousedown="handleLineDown($event, 'se')"
                  @touchstart="handleLineDown($event, 'se')"
                ></span
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="right">
      <div
        class="card w-96 bg-base-100 shadow-xl p-6 mb-4 flex flex-col mt-10"
        v-show="imgBaseUrl"
      >
        <div class="w-full">
          <div class="flex justify-between">
            <button @click="handleCut" class="btn mr-5">裁剪</button>

            <button class="btn" @click="reset">
              <el-icon><RefreshRight /></el-icon>重选图片
            </button>
          </div>
          <div class="my-5">
            输出结果：({{ outputWidth }}x{{ outputHeight }})
          </div>
        </div>

        <div class="result-img-container"></div>

        <div class="">
          <div>手动结果修正（10px以内）</div>

          上：<el-input-number
            v-model="customTop"
            :min="-10"
            :max="10"
            style="width: 100px"
          />
          下：<el-input-number
            v-model="customBottom"
            :min="-10"
            :max="10"
            style="width: 100px"
          />
          <el-button @click="handleCustom"> 修正 </el-button>
          <div class="flex flex-row my-2 justify-between">
            <el-button v-show="imgBaseUrl" @click="save" type="success"
              >保存</el-button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { RefreshRight } from '@element-plus/icons-vue';

export default {
  name: 'cut-image',
  components: {
    RefreshRight,
  },
  data() {
    return {
      loading: false,
      imgBaseUrl: '',
      customTop: 0,
      customBottom: 0,
      calcData: {},
      outputWidth: 0,
      outputHeight: 0,
      translateX: 0,
      translateY: 0,
      moveElWidth: 200,
      moveElHeight: 150,
      previewImgWidth: 0,
      previewImgHeight: 0,
      isMove: false,
    };
  },
  watch: {},
  methods: {
    handleLineDown(e, type) {
      this.isMove = true;

      console.log('type: ', type);
      // 上北下南 左西右东
      const isN =
        type.indexOf('n') > -1 ||
        type.indexOf('ne') > -1 ||
        type.indexOf('nw') > -1;
      const isS =
        type.indexOf('s') > -1 ||
        type.indexOf('se') > -1 ||
        type.indexOf('sw') > -1;
      const isW =
        type.indexOf('w') > -1 ||
        type.indexOf('nw') > -1 ||
        type.indexOf('sw') > -1;
      const isE =
        type.indexOf('e') > -1 ||
        type.indexOf('ne') > -1 ||
        type.indexOf('se') > -1;

      const vm = this;
      let downX = 'clientX' in e ? e.clientX : e.touches[0].clientX,
        downY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

      window.addEventListener('mousemove', handleLineMove);
      window.addEventListener('mouseup', handleLineUp);
      window.addEventListener('touchmove', handleLineMove);
      window.addEventListener('touchend', handleLineUp);
      const pre_moveElHeight = vm.moveElHeight;
      const pre_moveElWidth = vm.moveElWidth;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function handleLineMove(e) {
        let nowX = 0;
        let nowY = 0;
        if (e) {
          nowX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
          nowY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        }
        let deltaX = nowX - downX;
        let deltaY = nowY - downY;

        if (isE) {
          let _res = Math.max(pre_moveElWidth + deltaX, 1);
          _res = Math.min(_res, vm.previewImgWidth);
          vm.moveElWidth = _res;
        }
        if (isS) {
          let _res = Math.max(pre_moveElHeight + deltaY, 1);
          _res = Math.min(_res, vm.previewImgHeight - vm.translateY);
          vm.moveElHeight = _res;
        }
        if (isW) {
          if (pre_translateX + deltaX >= 0 && deltaX < pre_moveElWidth) {
            vm.translateX = Math.max(pre_translateX + deltaX, 0);
            if (pre_moveElWidth - deltaX < 1) {
              vm.moveElWidth = 1;
            } else {
              vm.moveElWidth = Math.max(pre_moveElWidth - deltaX, 1);
            }
          }
        }
        if (isN) {
          if (pre_translateY + deltaY >= 0 && deltaY < pre_moveElHeight) {
            vm.translateY = Math.max(pre_translateY + deltaY, 0);
            if (pre_moveElHeight - deltaY < 1) {
              vm.moveElHeight = 1;
            } else {
              vm.moveElHeight = Math.max(pre_moveElHeight - deltaY, 1);
            }
          }
        }
      }
      function handleLineUp(e) {
        vm.isMove = false;
        console.log(vm.moveElWidth, vm.moveElHeight);
        console.log(vm.translateX, vm.translateY);
        window.removeEventListener('mousemove', handleLineMove);
        window.removeEventListener('mouseup', handleLineUp);
        window.removeEventListener('touchmove', handleLineMove);
        window.removeEventListener('touchend', handleLineUp);
      }
    },
    handleMoveEl(e) {
      const vm = this;
      vm.isMove = true;
      console.log(vm.translateX, vm.translateY);
      window.addEventListener('mousemove', moveCrop);
      window.addEventListener('mouseup', leaveCrop);
      window.addEventListener('touchmove', moveCrop);
      window.addEventListener('touchend', leaveCrop);
      const moveEl = document.querySelector('.cropper-crop-box');
      let downX = 'clientX' in e ? e.clientX : e.touches[0].clientX,
        downY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const pre_translateX = vm.translateX;
      const pre_translateY = vm.translateY;
      function moveCrop(e) {
        let nowX = 0;
        let nowY = 0;
        if (e) {
          e.preventDefault();
          nowX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
          nowY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
        }

        let newX = Math.max(pre_translateX + nowX - downX, 0);
        let newY = Math.max(pre_translateY + nowY - downY, 0);

        if (newX > vm.previewImgWidth - vm.moveElWidth) {
          newX = vm.previewImgWidth - vm.moveElWidth;
        }
        if (newY > vm.previewImgHeight - vm.moveElHeight) {
          newY = vm.previewImgHeight - vm.moveElHeight;
        }
        vm.translateX = newX;
        vm.translateY = newY;
      }
      function leaveCrop(e) {
        vm.isMove = false;
        console.log(vm.translateX, vm.translateY);
        window.removeEventListener('mousemove', moveCrop);
        window.removeEventListener('mouseup', leaveCrop);
        window.removeEventListener('touchmove', moveCrop);
        window.removeEventListener('touchend', leaveCrop);
      }
    },

    fileChange(e) {
      this.reset();
      const [file] = e.target.files;
      console.log(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const vm = this;

      reader.onload = () => {
        var base64 = reader.result;
        this.imgBaseUrl = base64;

        document.querySelector('.preview-img').onload = function () {
          const { width, height } = this;
          console.log(width, height);
          vm.previewImgWidth = vm.moveElWidth = width;
          vm.previewImgHeight = vm.moveElHeight = height;
          vm.handleCut();
        };
      };
    },
    save() {
      const imgEl = document.getElementById('base64Img');
      if (!imgEl) {
        return;
      }
      // 获取Base64字符串
      var base64Image = imgEl?.src;
      var link = document.createElement('a');
      link.href = base64Image;
      link.download = 'image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    setOutputImg() {
      const img = new Image();
      const vm = this;
      let { bottom, top } = vm.calcData;
      top = top + vm.customTop;
      bottom = bottom - vm.customBottom;
      img.src = vm.imgBaseUrl;
      img.onload = function () {
        const { width, height } = img;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = bottom - top - 1;
        console.log('输出图片 width height', canvas.width, canvas.height);
        vm.outputWidth = canvas.width;
        vm.outputHeight = canvas.height;
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true,
        });
        ctx.drawImage(
          img,
          0,
          top + 1,
          canvas.width,
          canvas.height,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        canvas.style.width = '100px';
        const resultImg = new Image();
        resultImg.src = canvas.toDataURL();
        resultImg.id = 'base64Img';
        resultImg.style.width = '50%';

        document.querySelector('.result-img-container').appendChild(resultImg);
        vm.loading = false;
      };
    },
    handleCut() {
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
      this.loading = true;
      var worker = new Worker('/worker.js');
      const vm = this;
      worker.onmessage = function (event) {
        const { bottom, top } = event.data;
        console.log('Message from worker:', event.data);
        vm.calcData = { bottom, top };
        vm.setOutputImg();
      };

      const canvas = document.createElement('canvas');

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      });

      const img = new Image();
      img.src = vm.imgBaseUrl;
      img.onload = function () {
        const { width, height } = img;
        console.log(' width, height: ', width, height);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        let start = vm.translateY,
          end = vm.translateY + vm.moveElHeight;
        start = Math.floor((start * height) / vm.previewImgHeight);
        end = Math.ceil((end * height) / vm.previewImgHeight);
        console.log(start, end);
        worker.postMessage({ imageData, width, height, start, end });
      };
    },
    removeBase64Img() {
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
      this.imgBaseUrl = '';
    },
    handleCustom() {
      const imgEl = document.getElementById('base64Img');
      if (imgEl) {
        imgEl.remove();
      }
      this.setOutputImg();
    },
    reset() {
      this.customTop = 0;
      this.customBottom = 0;
      this.calcData = {};
      this.outputWidth = 0;
      this.outputHeight = 0;
      this.removeBase64Img();
    },
  },
  mounted() {},
};
</script>
<style scoped>
.preview-container {
  position: relative;
  width: 40%;
  touch-action: none;
}

.cut-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.bg-container {
  position: relative;
  touch-action: none;
  min-width: 360px;
  min-height: 360px;
  width: 40vw;
  height: 40vw;
}
.px-bg {
  position: absolute;
  left: 0;
  top: 0;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  direction: ltr;
  text-align: left;
  width: 100%;
  height: 100%;
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAArrAAAK6wGCiw1aAAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M26LyyjAAAABFJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC');
}
.mask-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.cropper-view-box {
  display: block;
  overflow: hidden;
  width: 100%;
  height: 100%;
  outline: 1px solid #39f;
  outline-color: rgba(51, 153, 255, 0.75);
  user-select: none;
}

.cropper-view-box img {
  user-select: none;
  text-align: left;
  max-width: none;
  max-height: none;
}

.cropper-face {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: #fff;
  opacity: 0.3;
  cursor: move;
}

.crop-info {
  position: absolute;
  left: 0px;
  min-width: 65px;
  text-align: center;
  color: white;
  line-height: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  font-size: 12px;
}

.crop-line {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

.line-n {
  top: -3px;
  left: 0;
  height: 5px;
  cursor: n-resize;
}

.line-w {
  top: 0;
  left: -3px;
  width: 5px;
  cursor: w-resize;
}

.line-s {
  bottom: -3px;
  left: 0;
  height: 5px;
  cursor: s-resize;
}

.line-e {
  top: 0;
  right: -3px;
  width: 5px;
  cursor: e-resize;
}

.crop-point {
  position: absolute;
  width: 8px;
  height: 8px;
  opacity: 0.75;
  /* background-color: #39f; */
  background-color: red;
  border-radius: 100%;
}

.point1 {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.point2 {
  top: -5px;
  left: 50%;
  margin-left: -3px;
  cursor: n-resize;
}

.point3 {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.point4 {
  top: 50%;
  left: -4px;
  margin-top: -3px;
  cursor: w-resize;
}

.point5 {
  top: 50%;
  right: -4px;
  margin-top: -3px;
  cursor: e-resize;
}

.point6 {
  bottom: -5px;
  left: -4px;
  cursor: sw-resize;
}

.point7 {
  bottom: -5px;
  left: 50%;
  margin-left: -3px;
  cursor: s-resize;
}

.point8 {
  bottom: -5px;
  right: -4px;
  cursor: se-resize;
}

@media screen and (max-width: 500px) {
  .crop-point {
    position: absolute;
    width: 20px;
    height: 20px;
    opacity: 0.45;
    background-color: #39f;
    border-radius: 100%;
  }

  .point1 {
    top: -10px;
    left: -10px;
  }

  .point2,
  .point4,
  .point5,
  .point7 {
    display: none;
  }

  .point3 {
    top: -10px;
    right: -10px;
  }

  .point4 {
    top: 0;
    left: 0;
  }

  .point6 {
    bottom: -10px;
    left: -10px;
  }

  .point8 {
    bottom: -10px;
    right: -10px;
  }
}
</style>
