<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="space-y-2">
        <label class="text-sm font-medium text-base-content">模板字符串</label>
        <AutoTextarea v-model="code" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <label class="text-sm font-medium text-base-content">字符串拼接</label>
          <button
            v-if="code2"
            type="button"
            class="btn btn-ghost btn-xs text-primary"
            @click="copyRes">
            复制
          </button>
        </div>
        <AutoTextarea v-model="code2" disabled />
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button class="btn btn-primary btn-sm sm:btn-md" @click="getCodemirrorStates">
        转换为字符串拼接
      </button>
      <button class="btn btn-ghost btn-sm sm:btn-md" :disabled="!code2" @click="copyRes">
        复制结果
      </button>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';

const code = ref(`\`<div>
  <div>\${text}</div>
</div>\``);
const code2 = ref(``);

const getCodemirrorStates = () => {
  const code1Text = code.value.split('\n');

  code2.value = code1Text.reduce((pre, cur) => {
    let _cur = cur.replace('`', '');
    if (pre === '') {
      if (_cur.length > 0) {
        return `${handleStr(_cur)}`;
      }
      return pre;
    }
    if (_cur.length > 0) {
      return `${pre}+\n${handleStr(_cur)}`;
    }
    return pre;
  }, '');

  function handleStr(str) {
    return (
      '"' +
      str.replaceAll(/\$\{(.*?)\}/g, (...args) => {
        return `"+${args[1]}+"`;
      }) +
      '"'
    );
  }
};

const copyRes = () => {
  if (!code2.value) {
    ElMessage.warning('结果为空');
    return;
  }
  navigator.clipboard.writeText(code2.value);
  ElMessage.success('复制成功');
};
</script>
