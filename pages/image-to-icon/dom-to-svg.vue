<template>
  <div class="dom-to-svg bg-[#cccccc] flex flex-col gap-4 items-center p-4">
    <!-- dom 图 -->
    <div class="addPost">
      <div class="addPost-main">
        <div class="addPost-i">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728="">
            <path fill="currentColor"
              d="M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64h352z">
            </path>
          </svg>
        </div>
      </div>
    </div>
    <div class="flex gap-4">
      <button @click="toDo" class="btn">转图片</button>
      <!-- <button @click="toSvg" class="btn">toSvg</button> -->




    </div>
    <!-- <div v-html="result"></div> -->
  </div>
  <div>
    <a href="https://cdkm.com/cn/svg-to-jpg" target="_blank" class="link">在线SVG转JPG</a>
  </div>
</template>

<script lang="ts" setup>
import domtoimage from 'dom-to-image';
import { elementToSVG, inlineResources } from 'dom-to-svg';
const result = ref('');

function toDo() {
  const node = document.querySelector('.addPost')!;

  domtoimage
    .toPng(node)
    .then(function (dataUrl) {
      var img = new Image();
      img.src = dataUrl;
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx?.drawImage(img, 0, 0);
        // document.body.appendChild(canvas);
        // return
        canvas.toBlob(function (blob) {
          console.log(blob);
          const url = window.URL.createObjectURL(blob!);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'addPost.png';
          document.body.appendChild(a);
          a.click();
          a.remove();
        });
      };
    })
    .catch(function (error) {
      console.error('wrong!', error);
    });
}

async function toSvg() {
  const svgDocument = elementToSVG(document.querySelector('.addPost')!);
  await inlineResources(svgDocument.documentElement);
  const svgString = new XMLSerializer().serializeToString(svgDocument);
  console.log('svgString: ', svgString);
  result.value = svgString;
}
</script>

<style scoped>
.addPost {
  width: 200px;
  height: 200px;
  padding: 0;
  position: relative;
  overflow: initial;
}

.addPost .addPost-main {
  position: absolute;
  background-color: #fff;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: solid 8px #f9f9f9;
  box-sizing: border-box;
}

.addPost-i {
  background-color: #abfbeb;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  line-height: 200px;
  text-align: center;
  font-size: 140px;
  color: #fff;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
}

.addPost-i svg {
  width: 105px;
}
</style>
