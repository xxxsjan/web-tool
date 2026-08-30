<template>
  <textarea v-model="textInput" type="textarea" placeholder="Please input"
    class="textarea textarea-bordered w-full min-h-[160px] font-mono text-sm leading-relaxed"
    resize="none" rows="8" @input="handleChange" v-bind="$attrs"></textarea>
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
