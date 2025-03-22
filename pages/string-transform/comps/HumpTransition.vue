<template>
  <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow w-full">
    <div class="card-body space-y-4">
      <h2 class="card-title text-blue-600">
        <i class="eva eva-edit-2-outline mr-2"></i>驼峰命名转换
      </h2>

      <!-- 输入区域 -->
      <div class="form-control">
        <label class="label">
          <span class="label-text text-gray-500">输入需要转换的内容</span>
        </label>
        <div class="relative">
          <input v-model="oriVal" class="input input-bordered input-primary w-full pl-10" placeholder="例如：PascalCase">
          <i class="eva eva-hash-outline absolute left-3 top-3 text-gray-400"></i>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button v-for="(btn, i) in buttons" :key="i" class="btn btn-sm bg-blue-50 text-blue-600 hover:bg-blue-100 gap-1"
          @click="btn.action">
          <i :class="btn.icon"></i>
          {{ btn.label }}
        </button>
      </div>

      <!-- 结果展示 -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <span class="text-sm text-gray-500 mr-2">转换结果:</span>
            <span class="font-mono text-blue-600">{{ resultVal || '等待输入...' }}</span>
          </div>
          <button v-show="resultVal" @click="handleCopy" class="btn btn-ghost btn-sm text-blue-500 hover:bg-blue-100">
            <i class="eva eva-copy-outline mr-1"></i>复制
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const oriVal = ref('PascalCase');
const resultVal = ref('');
function handleCopy() {
  try {
    navigator.clipboard.writeText(resultVal.value);
    ElMessage({
      message: '已复制',
      type: 'success',
    });
  } catch (error) {
    alert(error);
  }
}
function kebabToPascal(str: string) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
function pascalToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function kebabToCamel(str: string) {
  return str
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}
function camelToKebab(str: string) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// 新增按钮配置
const buttons = [
  {
    label: '转烤串式',
    icon: 'eva eva-minus-square-outline',
    action: () => resultVal.value = pascalToKebab(oriVal.value)
  },
  {
    label: '转驼峰',
    icon: 'eva eva-toggle-right-outline',
    action: () => resultVal.value = kebabToCamel(oriVal.value)
  },
  {
    label: '转帕斯卡',
    icon: 'eva eva-toggle-left-outline',
    action: () => resultVal.value = kebabToPascal(oriVal.value)
  },
  {
    label: '转小驼峰',
    icon: 'eva eva-arrow-circle-down-outline',
    action: () => resultVal.value = camelToKebab(oriVal.value)
  }
];
</script>

<style scoped>
/* 新增过渡效果 */
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
