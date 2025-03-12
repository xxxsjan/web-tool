<template>
  <dialog id="my_modal_1" class="modal">
    <div class="modal-box">
      <textarea class="textarea" v-model="inputVal" placeholder="Please input" rows="10" style="width: 90%" />
      <div class="modal-action">
        <form method="dialog">
          <span class="dialog-footer">
            <button class="btn mr-2" @click="emit('update:modelValue', false)">关闭</button>
            <button class="btn" @click="handleCopy" type="success">复制结果</button>
          </span>
        </form>
      </div>
    </div>
  </dialog>
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

watch(
  () => props.modelValue,
  n => {
    console.log('n: ', n);
    emit('update:modelValue', n);
    if (n) {
      document.getElementById('my_modal_1').showModal()
    } else {
      document.getElementById('my_modal_1').close()
    }
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
