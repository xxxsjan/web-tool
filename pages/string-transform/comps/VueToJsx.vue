<template>
  <div class="vue-to-jsx w-full max-w-4xl p-6 bg-white rounded-xl shadow-lg">
    <!-- 双栏布局 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <i class="eva eva-code-outline text-blue-500"></i>
          Vue语法
        </h3>
        <textarea v-model="codeLeft" class="textarea textarea-bordered w-full h-64 font-mono text-sm"
          placeholder="请输入Vue模板代码..." @input="toGenerate"></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <i class="eva eva-file-text-outline text-green-500"></i>
            JSX语法
          </h3>
          <button @click="copyResult" class="btn btn-sm btn-ghost text-gray-500 hover:text-blue-500">
            copy
          </button>
        </div>
        <pre
          class="output-box p-4 h-64 overflow-auto bg-gray-50 rounded-md border border-gray-200 font-mono text-sm">{{ codeRight }}</pre>
      </div>
    </div>

    <!-- 状态提示 -->
    <div class="mt-4 text-center text-gray-400">
      <i class="eva eva-info-outline mr-2"></i>
      输入Vue模板代码后自动生成JSX
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
const dialogVisible = ref(false);

const codeLeft = ref(`<view class="guess viewPort" scroll-y :data="{a:'1'}" :show-scrollbar="false" :style="{ paddingTop: globalProperties.$safeAreaInsets!.top + 40 + 'px' }" @change="handleChange">
    <navigator
      v-for="item in guessList"
      :key="item.id"
      class="guess-item"
      hover-class="none"
      :url="\`/pages/goods/godds\`"
    >
      <image :src="item.picture" mode="aspectFill" class="image"></image>
      <view class="name">{{ item.name }}</view>
      <view class="price">
        <text class="small">¥</text>
        {{ item.price }}
      </view>
    </navigator>
  </view>
  `);
const codeRight = ref('左侧输入后点击转换即可输出');

// 新增复制功能
const copyResult = () => {
  navigator.clipboard.writeText(codeRight.value)
  ElMessage.success('已复制到剪贴板')
}

// 自动转换（移除原有对话框逻辑）
watch(codeLeft, () => toGenerate(), { immediate: true })
function hyphenToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (match, letter) {
    return letter.toUpperCase();
  });
}
function toGenerate() {
  let res = codeLeft.value;
  res = res.replace(/:([\w-]+)="(.*?)"/g, function (...rest) {
    return `${hyphenToCamelCase(rest[1])}={${rest[2]}}`;
  });

  res = res.replace(/@(\w+)="(.*?)"/g, function (...rest) {
    console.log('rest: ', rest);
    return `on${rest[1].charAt(0).toUpperCase() + rest[1].slice(1)
      }={${rest[2]}}`;
  });

  res = res.replace(/class=/g, 'className=');

  res = res.replace(/(?<!=)\{\{(.*?)\}\}/g, function (...rest) {
    return `{${rest[1]}}`;
  });

  res = res.replace(/ref="(.*?)"/g, function (...rest) {
    return `ref={${rest[1]}}`;
  });

  res = componentNameReplace(res);
  // <!-- xxx -->
  res = res.replace(/<!--.*?-->/g, function (...rest) {
    return `{/* ${rest[0]} */}`;
  });

  codeRight.value = res;
  dialogVisible.value = true;
}

function componentNameReplace(str) {
  const map = {
    'scroll-view': 'ScrollView',
    view: 'View',
    swiper: 'Swiper',
    navigator: 'Navigator',
    image: 'Image',
    text: 'Text',
  };
  for (let key in map) {
    const reg = new RegExp(`<(${key})|<\/(${key})>`, 'g');

    str = str.replace(reg, function (o, m1, m2, ...rest) {
      if (!m2) {
        return '<' + map[key];
      }
      if (!m1) {
        return `</${map[key]}>`;
      }
    });
  }
  return str;
}
</script>

<style scoped>
.output-box {
  white-space: pre-wrap;
  word-break: break-all;
}

/* 滚动条样式 */
.output-box::-webkit-scrollbar {
  width: 6px;
}

.output-box::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}
</style>
