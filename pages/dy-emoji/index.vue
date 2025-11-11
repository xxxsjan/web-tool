<template>
  <div class="w-full max-w-[1000px] mx-auto p-4">
    <!-- <img
      id="test"
      src="https://p26-im-emoticon-sign.byteimg.com/tos-cn-o-0812/oYDYBiQWEczAPoZjIBDAOBiAd4l0EgfY68Adkb~tplv-0wx4r9yasq-awebp-resize:0:0.awebp?biz_tag=aweme_im&lk3s=91c5b7cb&s=im_123&sc=emotion&x-expires=1787050928&x-signature=%2Fx%2FNhMwJ2EOCSvMYGca4WATW%2F7c%3D"
      alt=""
      @click="downloadGif"
      crossorigin="anonymous"
    /> -->
    <div class="flex flex-col gap-4">
      <!-- 输入框 -->
      <textarea
        v-model="inputText"
        class="textarea textarea-bordered w-full min-h-[200px]"
        placeholder="请输入包含图片链接的文本"
      ></textarea>

      <!-- 新增：引用单图下载组件 -->
      <SingleImageDownloader />

      <!-- 按钮 -->
      <div class="flex justify-center gap-4">
        <button class="btn btn-primary" @click="handleParse">解析图片</button>
        <button
          class="btn btn-secondary"
          @click="handleDownloadAll"
          :disabled="!imageUrls.length || downloading"
        >
          {{ downloading ? `下载中 ${progress}%` : '打包下载' }}
        </button>
        <!-- 新增教程按钮 -->
        <button class="btn btn-link" @click="showTutorial = true">
          这里获取文本
        </button>
        <a
          class="btn btn-link"
          href="https://www.iloveimg.com/zh-cn/convert-to-jpg/webp-to-jpg"
          target="_blank"
          rel="noopener noreferrer"
          >webp-to-jpg</a
        >
        <a
          class="btn btn-link"
          href="https://imagetostl.com/cn/convert/file/webp/to/gif"
          target="_blank"
          rel="noopener noreferrer"
          >webp to gif</a
        >
      </div>
      <div>
        https://www.douyin.com/video/
      </div>

      <!-- 新增教程弹窗 -->
      <Model :show="showTutorial" @close="showTutorial = false">
        <img src="/tutorial.png" alt="教程" class="max-h-[80vh] mx-auto" />
      </Model>

      <!-- 图片展示区 -->
      <div
        class="flex flex-wrap gap-2 relative"
        v-if="imageUrls.length"
        ref="imageContainer"
      >
        <div
          v-for="(url, index) in imageUrls"
          :key="index"
          class="relative group"
        >
          <img
            :src="url"
            class="w-[100px] h-[100px] object-cover rounded"
            @error="handleImageError($event, index)"
            @contextmenu.prevent="handleRightClick($event, url)"
            :id="getId(url)"
            crossOrigin="anonymous"
          />
          <!-- <div
                        class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a :href="url" target="_blank" class="hover:text-blue-300">查看原图</a>
                    </div> -->
          <!-- 新增右键菜单 -->
        </div>
        <div
          v-if="showContextMenu"
          class="absolute bg-white shadow-lg rounded p-2 text-sm"
          :style="{ left: `${menuX}px`, top: `${menuY}px` }"
        >
          <button
            class="hover:bg-gray-100 px-2 py-1 w-full text-left"
            @click="downloadSingleImage"
            v-if="currentDownloadUrl.indexOf('awebp') === -1"
          >
            {{
              currentDownloadUrl.indexOf('webp') > -1 ? '下载为jpg' : '下载图片'
            }}
          </button>
          <button
            class="hover:bg-gray-100 px-2 py-1 w-full text-left"
            @click="downloadGif"
            v-else
          >
            下载动图
          </button>
          <button
            class="hover:bg-gray-100 px-2 py-1 w-full text-left"
            @click="openOriginalImage"
          >
            查看原图
          </button>
          <!-- 使用新的Tailwind版本复制按钮组件 -->
          <div class="px-2 py-1 w-full">
            <CopyBtn
              :text="currentDownloadUrl"
              buttonText="复制图片地址"
              successText="已复制地址"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import domText from './dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// 新增：导入单图下载组件
import SingleImageDownloader from './SingleImageDownloader.vue';
import { convertWebpToJpgAndDownload } from './utils';

import CopyBtn from './CopyBtn.vue';
const inputText = ref(domText);
const imageUrls = ref<string[]>([]);
const showTutorial = ref(false);
// 新增右键菜单状态
const showContextMenu = ref(false);
const menuX = ref(0);
const menuY = ref(0);
let currentDownloadUrl = '';
// 新增本地存储键名
const STORAGE_KEY = 'cached-emoji-input';
// 在 script 中添加 ref
const imageContainer = ref<HTMLElement | null>(null);
// 新增挂载时读取缓存
onMounted(() => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    inputText.value = cached;
  }
});

function handleParse() {
  if (!inputText.value) return;

  // 新增保存到本地存储
  localStorage.setItem(STORAGE_KEY, inputText.value);

  // 匹配图片URL的正则表达式
  const imgRegex =
    /<img[^>]+src="([^">]+)"|https?:\/\/[^<\s]+?\.(jpg|jpeg|png|gif|webp)/gi;
  const matches = inputText.value.match(imgRegex) || [];

  // 提取URL
  imageUrls.value = matches
    .map(match => {
      // 如果是img标签，提取src
      if (match.startsWith('<img')) {
        const srcMatch = match.match(/src="([^"]+)"/);
        return srcMatch ? srcMatch[1].replaceAll('amp;', '') : '';
      }
      // 如果是直接的URL
      return match;
    })
    .filter(Boolean);
}

function handleImageError(event: Event, index: number) {
  const img = event.target as HTMLImageElement;
  img.src = 'https://dummyimage.com/100x100/ccc/fff&text=加载失败';
}

const downloading = ref(false);
const progress = ref(0);

async function handleDownloadAll() {
  if (!imageUrls.value.length) return;
  downloading.value = true;
  progress.value = 0;

  const zip = new JSZip();
  const total = imageUrls.value.length;

  for (let i = 0; i < total; i++) {
    const url = imageUrls.value[i];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const { pathname } = new URL(url);
      const filename = pathname.split('/').pop() || `image_${i + 1}`;
      const mimeType = blob.type;
      const extension = mimeType.split('/')[1] || 'png';
      zip.file(`${filename}.${extension}`, blob);

      // 更新进度
      progress.value = Math.round(((i + 1) / total) * 100);
    } catch (error) {
      console.error('下载图片失败:', url, error);
    }
  }

  try {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'images.zip');
  } catch (error) {
    console.error('生成压缩包失败:', error);
  } finally {
    downloading.value = false;
    progress.value = 0;
  }
}
// 右键点击处理
function handleRightClick(event: MouseEvent, url: string) {
  event.preventDefault();
  currentDownloadUrl = url;
  showContextMenu.value = true;
  const container = imageContainer.value;
  if (container) {
    const rect = container.getBoundingClientRect();
    menuX.value = event.clientX - rect.left;
    menuY.value = event.clientY - rect.top;
  }
  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu);
  }, 10);
}
// 关闭右键菜单
function closeContextMenu() {
  showContextMenu.value = false;
  document.removeEventListener('click', closeContextMenu);
  window.removeEventListener('scroll', closeContextMenu);
}
// 在 script 部分新增方法
function openOriginalImage() {
  window.open(currentDownloadUrl, '_blank');
  closeContextMenu();
}

function downJpg() {
  if (!currentDownloadUrl) return;

  const urlObj = new URL(currentDownloadUrl);
  const pathname = urlObj.pathname;
  if (pathname.endsWith('webp')) {
    const filename = urlObj.pathname.split('/').pop() || 'image';
    convertWebpToJpgAndDownload(
      currentDownloadUrl,
      `${filename.split('~')[0]}.jpg`,
    );
    return;
  }
}
function getId(url: string) {
  if (url) {
    const filename = new URL(url).pathname.split('/').pop() || 'image';

    return filename.split('~')[0];
  }
  return Date.now() + '';
}

function downloadGif() {
  if (!currentDownloadUrl) return;
  // const currentDownloadUrl = 'https://www.diydoutu.com/bq/2435.gif';
  // const currentDownloadUrl =
  //   'https://p26-im-emoticon-sign.byteimg.com/tos-cn-o-0812/oYDYBiQWEczAPoZjIBDAOBiAd4l0EgfY68Adkb~tplv-0wx4r9yasq-awebp-resize:0:0.awebp?biz_tag=aweme_im&lk3s=91c5b7cb&s=im_123&sc=emotion&x-expires=1787050928&x-signature=%2Fx%2FNhMwJ2EOCSvMYGca4WATW%2F7c%3D';

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    console.log(img.width, img.height);
    // https://github.com/jnordberg/gif.js
    const gif = new GIF({
      workers: 2, // 使用 2 个工作线程
      quality: 10, // 质量（1-10，10 最高）
      width: img.width,
      height: img.height,
    });
    console.log(gif);
    gif.addFrame(img, { delay: 200 }); // delay 为帧延迟（毫秒）
    gif.on('finished', function (blob: Blob) {
      console.log('blob: ', blob);
      window.open(URL.createObjectURL(blob));
    });
    gif.render();
  };
  img.onerror = function () {
    console.error('WebP 图片加载失败');
  };
  img.src = currentDownloadUrl;
}
// 单个下载逻辑
async function downloadSingleImage() {
  if (!currentDownloadUrl) return;
  if (currentDownloadUrl.indexOf('webp') > -1) {
    downJpg();
    return;
  }

  try {
    const response = await fetch(currentDownloadUrl);
    const blob = await response.blob();
    const urlObj = new URL(currentDownloadUrl);
    console.log('urlObj: ', urlObj);
    const filename = urlObj.pathname.split('/').pop() || 'image';
    const mimeType = blob.type;
    const extension = mimeType.split('/')[1] || 'png';
    saveAs(blob, `${filename}.${extension}`);
  } catch (error) {
    console.error('下载失败:', error);
  } finally {
    closeContextMenu();
  }
}
</script>

<style scoped>
.textarea:focus {
  outline: none;
  border-color: #3b82f6;
}
</style>
