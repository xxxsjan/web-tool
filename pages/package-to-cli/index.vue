<template>
  <div class="flex gap-4 mx-8 flex-col md:flex-row">
    <div class="w-full flex-1">
      <p class="text-base mb-4"> </p>
      <textarea class="textarea textarea-bordered w-full" v-model="codeLeft" placeholder="Bio" resize="none" rows="15"
        @input="handleChange"></textarea>
    </div>

    <div class="flex-1">
      <div class="card w-96 bg-base-100 shadow-xl my-6">
        <div class="card-body">
          <h2 class="card-title"></h2>

          <div class="form-layout">
            <div class="form-item">
              <div class="form-label">包</div>
              <div class="radio-group">
                <input type="radio" id="npm" v-model="form.npmName" value="npm">
                <label for="npm">npm</label>
                <input type="radio" id="pnpm" v-model="form.npmName" value="pnpm">
                <label for="pnpm">pnpm</label>
                <input type="radio" id="yarn" v-model="form.npmName" value="yarn">
                <label for="yarn">yarn</label>
              </div>
            </div>
            <div class="form-item">
              <div class="form-label">操作</div>
              <div class="radio-group">
                <input type="radio" id="add" v-model="form.operate" value="add">
                <label for="add">add</label>
                <input type="radio" id="remove" v-model="form.operate" value="remove">
                <label for="remove">remove</label>
              </div>
            </div>
            <div class="form-item">
              <div class="form-label">环境</div>
              <div class="radio-group">
                <input type="radio" id="s" v-model="form.dev" value="-S">
                <label for="s">-S</label>
                <input type="radio" id="d" v-model="form.dev" value="-D">
                <label for="d">-D</label>
              </div>
            </div>
          </div>
          <div class="card-actions justify-end">
            <button class="btn" @click="() => toGenerate()">生成</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ResultDialog v-model="dialogVisible" :result="codeRight" />
</template>

<script setup>
defineOptions({
  name: 'package-to-cli',
});
const dialogVisible = ref(false);
function handleChange(e) {
  const textarea = e.target;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}
const form = reactive({ npmName: 'pnpm', dev: '-S', operate: 'add' });
const codeLeft = ref(`{
    "postcss": "8.4.12",
    "postcss-html": "1.3.0",
    "stylelint": "14.10.0",
    "stylelint-config-html": "1.0.0",
    "stylelint-config-prettier": "9.0.3",
    "stylelint-config-recommended": "7.0.0",
    "stylelint-config-recommended-scss": "8.0.0",
    "stylelint-config-recommended-vue": "1.4.0",
    "stylelint-config-standard": "25.0.0",
    "stylelint-config-standard-scss": "4.0.0",
    "stylelint-order": "6.0.3",
}`);
const codeRight = ref('左侧输入后点击转换即可输出');
function toGenerate(code) {
  code = code || codeLeft.value;
  const firmText = code.replace(/\s|\{|\}/g, '');
  const isAdd = form.operate === 'add';
  const pkgList = firmText.split(',').reduce((pre, cur) => {
    if (cur) {
      const mat = cur.match(/"(.*?)":"\^?(.*?)"/);
      if (mat) {
        const [a, name, version] = mat;
        pre.push(`${name}${isAdd ? '@' + version : ''}`);
      }
    }
    return pre;
  }, []);
  const operate =
    form.npmName === 'npm'
      ? isAdd
        ? 'install'
        : 'uninstall'
      : isAdd
        ? 'add'
        : 'remove';
  codeRight.value = `${form.npmName} ${operate} ${pkgList.join(' ')} ${form.dev || ''
    }`;
  dialogVisible.value = true;
  // copyResult(codeRight.value);
}
</script>

<style scoped>
.wrapper {
  grid-template-columns: 1fr 210px 1fr;
}

.form-layout {
  display: flex;
  flex-direction: column;
}

.form-item {
  display: flex;
  margin-bottom: 10px;
}

.form-label {
  width: 60px;
  margin-right: 10px;
}

.radio-group {
  display: flex;
  align-items: center;
}

.radio-group input {
  margin-right: 5px;
}

.radio-group label {
  margin-right: 10px;
}
</style>
