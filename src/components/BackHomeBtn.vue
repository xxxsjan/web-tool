<template>
  <a href="/" class="navbar-link-btn-back-home mb-4">
    <IconArrowLeft />
    <span class="mr-15">返回首页</span></a
  >
</template>

<script setup>
import IconArrowLeft from '@/components/icons/arrow-left.vue';
</script>

<style lang="scss" scoped>
.navbar-link-btn-back-home {
  border: 0.0625rem solid;
  border-radius: 62.4375rem;

  margin-right: 0.625rem;
  padding: 0.1875rem 0.3125rem;

  color: #249ffd;

  display: inline-flex;
  width: max-content;

  svg {
    width: 16px;
    height: 16px;
  }
}
</style>
