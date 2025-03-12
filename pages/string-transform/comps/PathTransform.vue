<template>
  <div class="card w-[700px] bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">windows路径转换</h2>
      <div class="less-to-css flex flex-col justify-center items-center">
        <input v-selectCopy v-model="originVal" type="textarea" placeholder="请输入windows的路径" rows="5"
          class="input w-full" resize="none" />
        <div class="my-[10px]">
          <button class="btn" @click="toDo">生成</button>
        </div>
        <input class="input" v-show="result" v-model="result" type="textarea" :autosize="{ minRows: 3, maxRows: 15 }"
          style="width: 50%" resize="none" @focus="$event => $event.target.select()" />
      </div>
    </div>
  </div>
</template>

<script>
const selectCopy = el => {
  console.log(el);
  if (el) {
    el.onfocus = function () {
      console.log('focus: ');
    };
  }
};
export default {
  name: 'path-transform',
  directives: { selectCopy },
};
</script>

<script setup>
// defineOptions({
//   name: 'path-transform'
// });

const dialogVisible = ref(false);
const originVal = ref(``);
const result = ref('');

function toDo() {
  console.log('result.value: ', result.value);
  if (!originVal.value) return;
  result.value = originVal.value.replace(/\\/g, '/');
  console.log('result.value: ', result.value);
  //   dialogVisible.value = true;
}
</script>
