<template>
  <textarea v-model="textInput" type="textarea" placeholder="Please input" class="textarea textarea-bordered w-1/2"
    resize="none" rows="10" @input="handleChange" v-bind="$attrs"></textarea>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);
const textInput = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
})
function handleChange(e) {
  const textarea = e.target;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}
</script>
