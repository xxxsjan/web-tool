<template>
  <div class="flex flex-col justify-center items-center gap-4">
    <div class="card w-[90vw] max-w-3xl bg-base-100 shadow-xl">
      <!-- 增加响应式宽度 -->
      <div class="card-body space-y-4">
        <h2 class="card-title text-2xl text-gray-700">图片转ICO工具</h2>
        <!-- 增强标题样式 -->

        <!-- 表单区域增加卡片样式 -->
        <div
          class="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200"
        >
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="form-control w-full max-w-xs">
              <label class="label">
                <span class="label-text text-gray-600">选择图片文件</span>
              </label>
              <input
                type="file"
                class="file-input file-input-bordered file-input-primary w-full"
                accept="image/*"
                @change="fileChange"
              />
            </div>

            <div class="form-control w-full max-w-xs">
              <label class="label">
                <span class="label-text text-gray-600">输出尺寸</span>
              </label>
              <select
                v-model="outputSize"
                class="select select-bordered select-primary w-full"
              >
                <option v-for="size in [16, 32, 48, 64, 256]" :value="size">
                  {{ size }}x{{ size }}
                </option>
              </select>
            </div>

            <button
              class="btn btn-primary mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
              :disabled="!file"
              @click="toDo"
            >
              <i class="eva eva-file-add mr-2"></i>生成ICO文件
            </button>
          </div>
        </div>

        <!-- 结果展示优化 -->
        <div v-if="resultArr.length" class="mt-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-4">生成结果</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(item, index) in resultArr"
              :key="index"
              class="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <div class="flex items-center gap-4">
                <img
                  :src="item.dataURL"
                  class="w-16 h-16 object-contain rounded-lg border border-gray-200 p-1"
                />
                <div class="flex-1">
                  <p class="font-medium text-gray-700">{{ item.iconName }}</p>
                  <p class="text-sm text-gray-500">
                    {{ outputSize }}x{{ outputSize }}像素
                  </p>
                </div>
                <button
                  @click="downCanvas(item)"
                  class="btn btn-sm btn-ghost text-blue-500 hover:bg-blue-50"
                >
                  <i class="eva eva-download mr-1"></i>下载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AvifToPng />

    <DomToSvg />
  </div>
</template>
<script setup>
// import { genFileId } from 'element-plus';
import DomToSvg from './dom-to-svg.vue';
import AvifToPng from './avif-to-png.vue';

const outputSize = ref(32);
const file = ref();

function toDo() {
  const _file = file.value;
  if (!_file) {
    return;
  }

  const fr = new FileReader();

  const filename = _file.name;

  const raw = _file;

  fr.readAsDataURL(raw);

  fr.onload = function () {
    // let base64 = this.result.replace(/^data:image\/\w+;base64,/, "");
    // let dataBuffer = new Buffer(base64, "base64");
    // console.log("dataBuffer: ", dataBuffer);
    // ipcRenderer.invoke("SAVE_IMAGE_BY_BASE64", this.result);
    image2ico(this.result, filename);
  };
}
const resultArr = ref([]);
function image2ico(baseurl, filename) {
  const size = outputSize.value;
  const imgEl = document.createElement('img');
  const iconName = `${filename.split('.')[0]}_icon_${size}`;

  imgEl.src = baseurl;
  imgEl.onload = function () {
    var canvas = document.createElement('canvas');

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    ctx.width = this.width;
    ctx.height = this.height;
    console.log(this.width, this.height);
    const data = aspectFit(this.width, this.height, size, size);
    console.log(data);

    ctx.drawImage(this, ...data);

    var dataURL = canvas.toDataURL();
    console.log(dataURL);

    resultArr.value.push({ iconName, canvas, dataURL });

    function aspectFit(imageWidth, imageHeight, canvasWidth, canvasHeight) {
      const imageRate = imageWidth / imageHeight;
      const canvasRate = canvasWidth / canvasHeight;
      let [dx, dy, dw, dh] = [];
      if (imageRate >= canvasRate) {
        dw = canvasWidth;
        dh = canvasWidth / imageRate;
      } else {
        dh = canvasHeight;
        dw = canvasHeight * imageRate;
      }
      dx = (canvasWidth - dw) / 2;
      dy = (canvasHeight - dh) / 2;
      return [dx, dy, dw, dh];
    }
  };
}

const downCanvas = ({ canvas, iconName }) => {
  function blobCallback(iconName) {
    return function (b) {
      var a = document.createElement('a');
      a.textContent = 'Download';
      a.download = iconName + '.ico';
      a.href = window.URL.createObjectURL(b);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(b);
      console.log(a, b);
    };
  }
  canvas.toBlob(
    blobCallback(iconName),
    'image/vnd.microsoft.icon',
    '-moz-parse-options:format=bmp;bpp=32',
  );
};

const fileChange = e => {
  file.value = e.target.files[0];
};
</script>
