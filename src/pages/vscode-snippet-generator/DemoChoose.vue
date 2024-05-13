<template>
  <button class="btn" @click="show">选择预设</button>

  <dialog id="my_modal_1" class="modal" role="dialog" ref="dialogRef">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
      </form>
      <table class="table">
        <thead>
          <tr>
            <th>片段名字</th>
            <th>prefix</th>
            <th>描述</th>
            <th>代码片段</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in demoList" :key="index">
            <td>{{ item.snippetName }}</td>
            <td>{{ item.prefix }}</td>
            <td>{{ item.description }}</td>
            <td>
              <button class="btn" @click="handleBtn(item)">使用</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </dialog>
</template>

<script setup>
import demoList from './data';

const dialogRef = ref();
const emit = defineEmits(['useCode']);
const handleBtn = row => {
  emit('useCode', row);
  closeDialog();
};
const show = () => {
  dialogRef.value.showModal();
};
const closeDialog = () => {
  dialogRef.value.close();
};
</script>
