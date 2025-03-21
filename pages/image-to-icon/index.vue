<template>
  <div class="flex flex-col justify-center items-center gap-4">
    <div class="card w-[700px] bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="card-title">图片转ico</div>
        <div class="flex gap-4 items-center">
          <input type="file" class="file-input w-full max-w-xs" @change="fileChange" />

          <select placeholder="尺寸" v-model="outputSize" class="select w-[100px]">
            <option value="16" label="16x16"></option>
            <option value="32" label="32x32"></option>
            <option value="48" label="48x48"></option>
            <option value="64" label="64x64"></option>
          </select>
          <button class="btn" @click="toDo">生成icon文件</button>
        </div>
        <h1>生成结果：</h1>
        <table class="table" v-if="resultArr.length">
          <thead>
            <tr>
              <th>图</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in resultArr" :key="index">
              <th>{{ index + 1 }}</th>
              <td>
                <img :src="item.dataURL" alt="" />
              </td>
              <td>
                <button @click="downCanvas(item)">下载</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DomToSvg />
  </div>
</template>
<script setup>
// import { genFileId } from 'element-plus';

import DomToSvg from './dom-to-svg.vue';

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
