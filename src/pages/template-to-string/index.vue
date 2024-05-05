<template>
  <div class="w-full h-full flex flex-col gap-2 justify-center items-center">
    <h2>模版字符串</h2>
    <auto-textarea v-model="code"></auto-textarea>

    <div class="w-96 flex justify-between">
      <button class="btn" @click="getCodemirrorStates">转换为字符串拼接</button>
      <button class="btn" @click="copyRes">复制结果</button>
    </div>

    <auto-textarea v-model="code2" disabled></auto-textarea>
  </div>
</template>

<script setup>
const code = ref(`\`<div>
  <div>\${text}</div>
</div>\``);
const code2 = ref(``);

const getCodemirrorStates = () => {
  const code1Text = code.value.split('\n');
  console.log(code1Text);

  code2.value = code1Text.reduce((pre, cur) => {
    let _cur = cur.replace('`', '');
    if (pre === '') {
      if (_cur.length > 0) {
        return `${handleStr(_cur)}`;
      } else {
        return pre;
      }
    } else {
      if (_cur.length > 0) {
        return `${pre}+\n${handleStr(_cur)}`;
      } else {
        return pre;
      }
    }
  }, '');
  function handleStr(str) {
    return (
      '"' +
      str.replaceAll(/\$\{(.*?)\}/g, (...args) => {
        // console.log(args);
        return `"+${args[1]}+"`;
      }) +
      '"'
    );
  }
};
const copyRes = () => {
  if (!code2.value) {
    alert('结果为空');
  }
  // 复制文本到剪切板
  navigator.clipboard.writeText(code2.value);
  alert('复制成功');
};
</script>
<style scoped></style>
