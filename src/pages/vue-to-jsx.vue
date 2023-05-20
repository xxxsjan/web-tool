<template>
  <div class="less-to-css flex flex-col justify-center items-center">
    <h1>{{ pageTitle }}}</h1>
    <el-input
      v-model="codeLeft"
      type="textarea"
      placeholder="Please input"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 50%"
      resize="none"
    />
    <div class="my-[10px]">
      <el-button @click="() => toGenerate()">生成</el-button>
    </div>
  </div>
  <resultDialog v-model="dialogVisible" :result="codeRight" />
</template>

<script setup>
const pageTitle = 'vue-to-jsx';
// defineOptions({
//   name: pageTitle
// });

const dialogVisible = ref(false);

const codeLeft = ref(`<view class="caption">
    <text class="text">猜你喜欢</text>
  </view>
  <view class="guess">
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
  <view class="loading-text" ref="myRef">
    {{ finish ? '没有更多了~' : '加载中...' }}
  </view>
  `);
const codeRight = ref('左侧输入后点击转换即可输出');
function toGenerate() {
  let res = '';
  res = codeLeft.value.replace(/:(\w+)="(.*?)"/g, function (...rest) {
    console.log('rest: ', rest);
    return `${rest[1]}={${rest[2]}}`;
  });
  res = res.replace(/class=/g, 'className=');
  res = res.replace(/{{(.*?)}}/g, function (...rest) {
    return `{${rest[1]}}`;
  });
  res = res.replace(/ref="(.*?)"/g, function (...rest) {
    return `ref={${rest[1]}}`;
  });
  res = componentNameReplace(res);
  codeRight.value = res;
  dialogVisible.value = true;
}

function componentNameReplace(str) {
  const map = {
    view: 'View',
    swiper: 'Swiper',
    navigator: 'Navigator',
    image: 'Image',
    text: 'Text'
  };
  for (let key in map) {
    const reg = new RegExp(key, 'g');
    str = str.replace(reg, map[key]);
  }
  return str;
}
</script>
