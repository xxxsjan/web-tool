<template>
  <div class="w-full max-w-[1000px] mx-auto p-6">
    <!-- <img
      id="test"
      src="https://p26-im-emoticon-sign.byteimg.com/tos-cn-o-0812/oYDYBiQWEczAPoZjIBDAOBiAd4l0EgfY68Adkb~tplv-0wx4r9yasq-awebp-resize:0:0.awebp?biz_tag=aweme_im&lk3s=91c5b7cb&s=im_123&sc=emotion&x-expires=1787050928&x-signature=%2Fx%2FNhMwJ2EOCSvMYGca4WATW%2F7c%3D"
      alt=""
      @click="downloadGif"
      crossorigin="anonymous"
    /> -->
    <div class="flex flex-col gap-6">
      <!-- 页面标题 -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">
          抖音表情包提取工具
        </h1>
        <p class="text-gray-600">
          输入包含图片链接的文本，一键提取和下载表情包
        </p>
      </div>

      <!-- 输入框 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">输入文本内容</span>
          <span class="label-text-alt">{{ imageUrls.length }} 张图片</span>
        </label>
        <textarea
          v-model="inputText"
          class="textarea textarea-bordered w-full min-h-[200px] focus:textarea-primary"
          placeholder="请输入包含图片链接的文本，或粘贴抖音评论区的HTML内容"
        ></textarea>
      </div>

      <!-- 单图下载组件 -->
      <div class="bg-base-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-center">单图下载工具</h3>
        <SingleImageDownloader />
      </div>

      <!-- 操作按钮区域 -->
      <div class="flex flex-col gap-4">
        <div class="flex justify-center gap-3 flex-wrap">
          <button class="btn btn-primary btn-md" @click="handleParse">
            <svg
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
            解析图片
          </button>
          <button
            class="btn btn-secondary btn-md"
            @click="handleDownloadAll"
            :disabled="!imageUrls.length || downloading"
          >
            <svg
              v-if="!downloading"
              class="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
            <svg
              v-else
              class="animate-spin w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
            {{ downloading ? `下载中 ${progress}%` : '打包下载' }}
          </button>
        </div>

        <!-- 视频号跳转区域 -->
        <div class="bg-base-200 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3 text-center">
            视频评论区保存法
          </h3>
          <div class="flex gap-3 items-center justify-center">
            <div class="form-control">
              <input
                v-model="videoId"
                type="text"
                placeholder="请输入抖音视频号"
                class="input input-bordered input-sm w-64 focus:input-primary"
                @keyup.enter="goToVideo"
              />
            </div>
            <button class="btn btn-accent btn-sm" @click="goToVideo">
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                ></path>
              </svg>
              跳转
            </button>
          </div>
          <p class="text-sm text-base-content/70 mt-2 text-center">
            输入抖音视频号，快速跳转到视频页面提取评论表情包
          </p>
        </div>
      </div>

      <!-- 工具链接区域 -->
      <div class="bg-base-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold mb-3 text-center">相关工具</h3>
        <div class="flex justify-center gap-3 flex-wrap">
          <button class="btn btn-ghost btn-sm" @click="showTutorial = true">
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            使用教程
          </button>
          <a
            class="btn btn-ghost btn-sm"
            href="https://www.iloveimg.com/zh-cn/convert-to-jpg/webp-to-jpg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              ></path>
            </svg>
            webp转jpg
          </a>
          <a
            class="btn btn-ghost btn-sm"
            href="https://imagetostl.com/cn/convert/file/webp/to/gif"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
              ></path>
            </svg>
            webp转gif
          </a>

          <a
            class="btn btn-ghost btn-sm"
            href="https://www.aconvert.com/cn/image/webp-to-gif/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
              ></path>
            </svg>
            webp-to-gif
          </a>
        </div>
      </div>

      <!-- 新增教程弹窗 -->
      <Model :show="showTutorial" @close="showTutorial = false">
        <img src="/tutorial.png" alt="教程" class="max-h-[80vh] mx-auto" />
      </Model>

      <!-- 图片展示区 -->
      <div v-if="imageUrls.length" class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">提取的图片</h3>
          <div class="text-sm text-base-content/70">
            共 {{ imageUrls.length }} 张图片
          </div>
        </div>
        <div
          class="flex flex-wrap gap-3 relative bg-base-200 rounded-lg p-4"
          ref="imageContainer"
        >
          <div
            v-for="(url, index) in imageUrls"
            :key="index"
            class="relative group cursor-pointer"
          >
            <img
              :src="url"
              class="w-[100px] h-[100px] object-cover rounded-lg border-2 border-transparent hover:border-primary transition-all duration-200 hover:shadow-lg"
              @error="handleImageError($event, index)"
              @contextmenu.prevent="handleRightClick($event, url)"
              :id="getId(url)"
              crossOrigin="anonymous"
            />
            <span
              v-if="url.indexOf('awebp') === -1"
              class="absolute bottom-1 right-1 bg-primary text-primary-content text-xs px-2 py-1 rounded-full shadow-lg font-medium"
            >
              webp
            </span>
            <!-- 悬停效果 -->
            <div
              class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <div class="text-white text-xs font-medium">右键操作</div>
            </div>
          </div>
          <!-- 右键菜单 -->
          <div
            v-if="showContextMenu"
            class="absolute bg-base-100 shadow-xl rounded-lg p-2 text-sm border border-base-300 z-50"
            :style="{ left: `${menuX}px`, top: `${menuY}px` }"
          >
            <button
              class="hover:bg-base-200 px-3 py-2 w-full text-left rounded-md transition-colors duration-150 flex items-center gap-2"
              @click="downloadSingleImage"
              v-if="currentDownloadUrl.indexOf('awebp') === -1"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              {{
                currentDownloadUrl.indexOf('webp') > -1
                  ? '下载为jpg'
                  : '下载图片'
              }}
            </button>
            <button
              class="hover:bg-base-200 px-3 py-2 w-full text-left rounded-md transition-colors duration-150 flex items-center gap-2"
              @click="downloadGif"
              v-else
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
                ></path>
              </svg>
              下载动图
            </button>
            <button
              class="hover:bg-base-200 px-3 py-2 w-full text-left rounded-md transition-colors duration-150 flex items-center gap-2"
              @click="openOriginalImage"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
              查看原图
            </button>
            <div class="border-t border-base-300 my-1"></div>
            <div class="px-1">
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
const videoId = ref('7582872812784798995'); // 新增视频号输入
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

// 新增跳转到视频页面的函数
function goToVideo() {
  if (!videoId.value.trim()) return;
  const url = `https://www.douyin.com/video/${videoId.value.trim()}`;
  window.open(url, '_blank');
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
