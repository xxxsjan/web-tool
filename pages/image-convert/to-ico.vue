<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div class="form-control w-full">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">选择图片</span>
        </label>
        <input
          type="file"
          class="file-input file-input-bordered file-input-sm w-full"
          accept="image/*"
          @change="fileChange"
        />
      </div>

      <div class="form-control w-full sm:w-36">
        <label class="label py-1">
          <span class="label-text text-sm text-base-content/70">输出尺寸</span>
        </label>
        <select v-model="outputSize" class="select select-bordered select-sm w-full">
          <option v-for="size in [16, 32, 48, 64, 256]" :key="size" :value="size">
            {{ size }}×{{ size }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="btn btn-primary btn-sm w-full sm:w-auto"
        :disabled="!file"
        @click="toDo"
      >
        生成 ICO
      </button>
    </div>

    <div v-if="resultArr.length" class="space-y-3 tool-panel-foot pt-4">
      <h3 class="text-sm font-medium text-base-content">生成结果</h3>
      <ul class="space-y-2">
        <li
          v-for="(item, index) in resultArr"
          :key="index"
          class="flex items-center gap-3 rounded-xl border border-app bg-base-200/40 px-3 py-2.5"
        >
          <img
            :src="item.dataURL"
            alt=""
            class="h-12 w-12 shrink-0 rounded-lg border border-app-strong bg-base-100 object-contain p-1"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-base-content">
              {{ item.iconName }}
            </p>
            <p class="text-xs text-base-content/50">
              {{ outputSize }}×{{ outputSize }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm shrink-0"
            @click="downCanvas(item)"
          >
            下载
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const outputSize = ref(32);
const file = ref();
const resultArr = ref([]);

function toDo() {
  const _file = file.value;
  if (!_file) return;

  const fr = new FileReader();
  const filename = _file.name;
  fr.readAsDataURL(_file);
  fr.onload = function () {
    image2ico(this.result, filename);
  };
}

function image2ico(baseurl, filename) {
  const size = outputSize.value;
  const imgEl = document.createElement('img');
  const iconName = `${filename.split('.')[0]}_icon_${size}`;

  imgEl.src = baseurl;
  imgEl.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const data = aspectFit(this.width, this.height, size, size);
    ctx.drawImage(this, ...data);

    const dataURL = canvas.toDataURL();
    resultArr.value.push({ iconName, canvas, dataURL });

    function aspectFit(imageWidth, imageHeight, canvasWidth, canvasHeight) {
      const imageRate = imageWidth / imageHeight;
      const canvasRate = canvasWidth / canvasHeight;
      let dx, dy, dw, dh;
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
  function blobCallback(name) {
    return function (b) {
      const a = document.createElement('a');
      a.download = name + '.ico';
      a.href = window.URL.createObjectURL(b);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(b);
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
