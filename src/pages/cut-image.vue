<template>
  <div class="cut-image-container">
    <div class="preview-container">
      <div v-loading="loading">
        <input type="file" @change="fileChange" />
      </div>
      <canvas id="canvas"></canvas>
    </div>
    <div class="output-container">
      <el-button @click="save">保存</el-button>
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
          const ctx = canvas.getContext("2d");
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
          document.querySelector(".output-container").appendChild(resultImg);
          vm.loading = false;
        };
      };

      const canvas = document.querySelector("#canvas");
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.src = vm.imgBaseUrl;
      img.onload = function () {
        const { width, height } = img;
        console.log(" width, height: ", width, height);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // vm.calcBlack(canvas);
        worker.postMessage({ imageData, width, height });
      };
    },
    calcBlack(canvas) {
      var ctx = canvas.getContext("2d");
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      // 计算顶部黑边大小
      var topOffset = 0;
      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
          var offset = (y * canvas.width + x) * 4;
          var red = data[offset];
          var green = data[offset + 1];
          var blue = data[offset + 2];
          if (red !== 0 || green !== 0 || blue !== 0) {
            topOffset = y;
            break;
          }
        }
        if (topOffset > 0) {
          break;
        }
      }

      // 计算底部黑边大小
      var bottomOffset = 0;
      for (var y = canvas.height - 1; y >= 0; y--) {
        for (var x = 0; x < canvas.width; x++) {
          var offset = (y * canvas.width + x) * 4;
          var red = data[offset];
          var green = data[offset + 1];
          var blue = data[offset + 2];
          if (red !== 0 || green !== 0 || blue !== 0) {
            bottomOffset = canvas.height - y - 1;
            break;
          }
        }
        if (bottomOffset > 0) {
          break;
        }
      }

      // 输出黑边大小
      console.log("Top offset:", topOffset);
      console.log("Bottom offset:", bottomOffset);
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
