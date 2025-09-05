<template>
  <button
    class="btn flex items-center justify-center px-3 py-1.5 rounded border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
    :class="{
      'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary':
        !isCopying && !isCopied && !disabled,
      'border-green-500 bg-green-50 text-green-700': isCopied && !isCopying,
      'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed':
        disabled || isCopying,
    }"
    @click="handleCopy"
    :disabled="isCopying || disabled"
    :title="title || '复制文本'"
  >
    <!-- 复制图标 -->
    <svg
      v-if="!isCopying && !isCopied"
      class="w-4 h-4 mr-1.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      ></path>
    </svg>

    <!-- 成功图标 -->
    <svg
      v-if="isCopied && !isCopying"
      class="w-4 h-4 mr-1.5 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 13l4 4L19 7"
      ></path>
    </svg>

    <!-- 复制中图标 -->
    <svg
      v-if="isCopying"
      class="w-4 h-4 mr-1.5 animate-spin"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>

    <!-- 按钮文本 -->
    <span v-if="!isCopying && !isCopied">{{ buttonText || '复制' }}</span>
    <span v-if="isCopying">复制中...</span>
    <span v-if="isCopied && !isCopying">{{ successText || '已复制' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义组件的props
interface CopyBtnProps {
  // 要复制的文本内容
  text: string;
  // 按钮禁用状态
  disabled?: boolean;
  // 自定义按钮文本
  buttonText?: string;
  // 复制成功后的文本
  successText?: string;
  // 按钮标题（鼠标悬停时显示）
  title?: string;
  // 成功提示的持续时间（毫秒）
  successDuration?: number;
}

const props = withDefaults(defineProps<CopyBtnProps>(), {
  disabled: false,
  buttonText: '复制',
  successText: '已复制',
  title: '复制文本',
  successDuration: 2000,
});

// 定义自定义事件
const emit = defineEmits<{
  click: [];
  copied: [text: string];
  error: [error: Error];
}>();

// 组件的状态
const isCopying = ref(false);
const isCopied = ref(false);

// 复制文本的方法
async function handleCopy() {
  if (props.disabled || !props.text) return;

  isCopying.value = true;

  try {
    // 尝试使用现代浏览器的剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.text);
    } else {
      // 降级方案：使用传统的execCommand方法
      fallbackCopyText(props.text);
    }

    // 显示复制成功状态
    isCopied.value = true;

    // 触发复制成功事件
    emit('copied', props.text);

    // 触发点击事件
    emit('click');

    // 一段时间后重置状态
    setTimeout(() => {
      isCopied.value = false;
    }, props.successDuration);
  } catch (error) {
    console.error('复制失败:', error);
    // 触发错误事件
    emit('error', error as Error);
  } finally {
    isCopying.value = false;
  }
}

// 降级复制方案
function fallbackCopyText(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // 避免在某些移动设备上弹出键盘
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand failed');
    }
  } catch (err) {
    throw err;
  } finally {
    document.body.removeChild(textArea);
  }
}
</script>

<!-- 移除了内联style标签，完全使用Tailwind CSS类 -->
