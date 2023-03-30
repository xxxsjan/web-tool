<template>
  <div class="cut-image-container">
    <div class="preview-container">
      <div v-loading="loading">
        <input type="file" @change="fileChange" accept=".png,.jpg,.jpeg" />
        <!-- <el-button @click="handleRetry">重新选择</el-button> -->
      </div>
      <canvas id="canvas"></canvas>
    </div>
    <div v-show="imgBaseUrl">输出结果：</div>
    <div class="output-container">
      <el-button v-show="imgBaseUrl" @click="save">保存</el-button>
    </div>
  </div>
</template>
<script>
export default {
  name: "cut-image",
  data() {
    return {
      loading: false,
      imgBaseUrl: "",
    };
  },
  methods: {
    fileChange(e) {
      this.handleRetry();
      const [file] = e.target.files;
      console.log(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        var base64 = reader.result;
        this.imgBaseUrl = base64;
        this.toDo();
      };
    },
    save() {
      const imgEl = document.getElementById("base64Img");
      if (!imgEl) {
        return;
      }
      // 获取Base64字符串
      var base64Image = imgEl?.src;
      var link = document.createElement("a");
      link.href = base64Image;
      link.download = "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    toDo() {
      this.loading = true;
      var worker = new Worker("/worker.js");
      const vm = this;
      worker.onmessage = function (event) {
        const { bottom, top } = event.data;
        console.log("Message from worker:", event.data);
        const img = new Image();

        img.src = vm.imgBaseUrl || "./test.jpg";
        img.onload = function () {
          const { width, height } = img;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = bottom - top - 1;
          console.log("output img width height", canvas.width, canvas.height);
          const ctx = canvas.getContext("2d", {
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
            canvas.height
          );
          canvas.style.width = "100px";
          const resultImg = new Image();
          resultImg.src = canvas.toDataURL();
          resultImg.id = "base64Img";
          resultImg.style.width = "50%";
          // document.querySelector(".output-container").appendChild(resultImg);
          document
            .querySelector(".output-container")
            .insertAdjacentElement("afterbegin", resultImg);
          vm.loading = false;
        };
      };

      const canvas = document.querySelector("#canvas");
      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      const img = new Image();
      img.src = vm.imgBaseUrl;
      img.onload = function () {
        const { width, height } = img;
        console.log(" width, height: ", width, height);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        worker.postMessage({ imageData, width, height });
      };
    },
    handleRetry() {
      const imgEl = document.getElementById("base64Img");
      if (imgEl) {
        imgEl.remove();
      }
      this.imgBaseUrl = "";
    },
  },
  mounted() {},
};
</script>
<style scoped>
#canvas {
  width: 50%;
}
</style>
