<template>
  <div class="flex flex-col justify-center items-center">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo1"
      action=""
      :auto-upload="false"
      :limit="1"
      :on-exceed="handleExceed"
      ref="upload"
      :http-request="httpRequest"
      list-type="picture-card"
    >
      <template #trigger>
        <el-icon><i-ep-Plus /></el-icon>
      </template>

      <template #tip>
        <div class="el-upload__tip">请选择一张图片</div>
      </template>
    </el-upload>

    <div>
      <el-select placeholder="尺寸" v-model="outputSize" class="w-[100px]">
        <el-option value="16" label="16x16"></el-option>
        <el-option value="32" label="32x32"></el-option>
        <el-option value="48" label="48x48"></el-option>
        <el-option value="64" label="64x64"></el-option>
      </el-select>
      <el-button type="primary" @click="toDo">生成icon文件</el-button>
    </div>
  </div>
</template>
<script setup>
import { genFileId } from "element-plus";
const upload = ref();
const fileList = ref([]);
const outputSize = ref(32);

// 超出limit触发
const handleExceed = (files) => {
  console.log("files: ", files, fileList);
  upload.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  // select the file manually. 代码形式添加file文件
  upload.value.handleStart(file);
};

function httpRequest(options) {
  // console.log(options);
  // ipcRenderer.invoke("REQ");
}
function submitUpload() {
  upload.value.submit();
}
function toDo() {
  // console.log(fileList.value[0]);
  if (fileList.value.length < 1) {
    return;
  }
  const fr = new FileReader();
  const { raw, name: filename } = fileList.value[0];
  fr.readAsDataURL(raw);

  fr.onload = function () {
    // let base64 = this.result.replace(/^data:image\/\w+;base64,/, "");
    // let dataBuffer = new Buffer(base64, "base64");
    // console.log("dataBuffer: ", dataBuffer);
    // ipcRenderer.invoke("SAVE_IMAGE_BY_BASE64", this.result);
    image2ico(this.result, filename);
  };
}

function image2ico(baseurl, filename) {
  const size = outputSize.value;
  const imgEl = document.createElement("img");
  const iconName = `${filename.split(".")[0]}_icon_${size}`;

  imgEl.src = baseurl;
  imgEl.onload = function () {
    var canvas = document.createElement("canvas");
    // canvas.width = this.width;
    canvas.width = size;
    // canvas.height = this.height;
    canvas.height = size;
    console.log("canvas: ", canvas);

    const ctx = canvas.getContext("2d");

    ctx.width = this.width;
    ctx.height = this.height;
    console.log(this.width, this.height);
    const data = aspectFit(this.width, this.height, size, size);
    console.log(data);

    ctx.drawImage(this, ...data);

    document.body.appendChild(canvas);
    function blobCallback(iconName) {
      return function (b) {
        var a = document.createElement("a");
        a.textContent = "Download";
        a.download = iconName + ".ico";
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
      "image/vnd.microsoft.icon",
      "-moz-parse-options:format=bmp;bpp=32"
    );
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
</script>
