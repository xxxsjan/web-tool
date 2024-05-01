<template>
  <div class="less-to-css flex flex-col justify-center items-center">
    <h1>{{ pageTitle }}</h1>
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

const codeLeft = ref(`
  <view class="guess viewPort" scroll-y data={{a:'1'}} :show-scrollbar="false" :style="{ paddingTop: globalProperties.$safeAreaInsets!.top + 40 + 'px' }" @change="handleChange">
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
    return `on${
      rest[1].charAt(0).toUpperCase() + rest[1].slice(1)
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
    text: 'Text'
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
