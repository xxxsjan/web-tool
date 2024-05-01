<template>
  <div class="index_page px-[6vw]">
    <div class="nya-container">
      <div class="nya-title">
        <i class="eva eva-thermometer-plus-outline"></i><span>工具</span>
      </div>

      <div class="flex flex-wrap justify-center">
        <div
          class="card w-1/3 bg-base-100 shadow-xl mr-4 mb-4"
          v-for="(item, index) in list"
          :key="index"
          @click="go(item.path)"
        >
          <div class="card-body">
            <h2 class="card-title">{{ item?.meta?.title || item.name }}</h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconTool from '@/components/icons/tool.vue';
import routes from '@/router/routes';
const list = ref(routes[0].children.filter(r => r.path !== '/'));
list.value.push({
  path: '/html/text-reading.html',
  name: '文字朗读'
});
const router = useRouter();
function go(path) {
  if (path.includes('.html')) {
    window.open(path);
  } else {
    router.push(path);
  }
}
</script>

<style lang="scss" scoped>
.index_page {
  position: relative;

  box-sizing: border-box;
  margin: 88px auto;

  --theme: #249ffd;
  --color-text: #2f3e4c;
}
.nya-container {
  position: relative;
}

.nya-container .nya-title {
  background-color: var(--theme);
  border-radius: 0.5rem;
  box-shadow: 0 0.3125rem 0.5rem rgba(36, 159, 253, 0.302);
  color: #fff;
  font-size: 0;
  font-weight: 700;
  left: 1.875rem;
  padding: 0.5rem 0.9375rem;
  position: absolute;
  top: -3rem;
}

.nya-container .nya-title i {
  font-size: 1.25rem;
  margin-right: 0.3125rem;
  vertical-align: middle;
}

.nya-container .nya-title span {
  font-size: 1.0625rem;
  line-height: 1.25rem;
  vertical-align: middle;
}
</style>
