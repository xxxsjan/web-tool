<template>
  <el-dialog
    v-model="dialogVisible"
    title="结果"
    width="60%"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <el-input
      v-model="inputVal"
      type="textarea"
      placeholder="Please input"
      autosize
      style="width: 90%"
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button @click="handleCopy" type="success">复制结果</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  result: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['update:modelValue']);
const dialogVisible = ref(false);

watchEffect(() => {
  dialogVisible.value = props.modelValue;
});
watch(
  () => dialogVisible.value,
  n => {
    emit('update:modelValue', n);
  }
);
const inputVal = ref('');
watch(
  () => props.result,
  n => {
    inputVal.value = n;
  }
);
const handleClose = done => {
  done();
};
const glp = getCurrentInstance().appContext.config.globalProperties;
const copyResult = coptText => {
  if (coptText && navigator.clipboard) {
    navigator.clipboard.writeText(coptText);
    glp.$message.success('结果已自动复制到粘贴板');
  }
};
const handleCopy = function () {
  copyResult(props.result);
  console.log(
    '🚀 ~ file: result-dialog.vue:70 ~ handleCopy ~ props.result:',
    props.result
  );
};
</script>
