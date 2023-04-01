<template>
  <div class="package-to-cli">
    <p>用法：根据依赖包版本信息，转化成命令行操作</p>
    <el-input
      v-model="codeLeft"
      type="textarea"
      placeholder="Please input"
      :autosize="{ minRows: 10, maxRows: 15 }"
      style="width: 50%"
      resize="none"
    />
    <el-card class="my-[10px]">
      <el-form :model="form" label-width="60px">
        <el-form-item label="包">
          <el-radio-group v-model="form.npmName">
            <el-radio label="npm" />
            <el-radio label="pnpm" />
            <el-radio label="yarn" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="form.operate">
            <el-radio label="add" />
            <el-radio label="remove" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="环境">
          <el-radio-group v-model="form.dev">
            <el-radio label="-S" />
            <el-radio label="-D" />
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button @click="() => toGenerate()">生成</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
  <!-- <LeftToRight
    v-model:codeLeft="codeLeft"
    v-model:codeRight="codeRight"
    @toGenerate="toGenerate"
  ></LeftToRight> -->
  <resultDialog v-model="dialogVisible" :result="codeRight" />
</template>

<script setup>
import resultDialog from "@/components/result-dialog.vue";
defineOptions({
  name: "package-to-cli",
});
const dialogVisible = ref(false);

const form = ref({ npmName: "pnpm", dev: "-S", operate: "add" });
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
const codeRight = ref("左侧输入后点击转换即可输出");
function toGenerate(code) {
  code = code || codeLeft.value;
  const firmText = code.replace(/\s|\{|\}/g, "");
  const isAdd = form.value.operate === "add";
  const pkgList = firmText.split(",").reduce((pre, cur) => {
    if (cur) {
      const mat = cur.match(/"(.*?)":"\^?(.*?)"/);
      if (mat) {
        const [a, name, version] = mat;
        pre.push(`${name}${isAdd ? "@" + version : ""}`);
      }
    }
    return pre;
  }, []);
  const operate =
    form.value.npmName === "npm"
      ? isAdd
        ? "install"
        : "uninstall"
      : isAdd
      ? "add"
      : "remove";
  codeRight.value = `${form.value.npmName} ${operate} ${pkgList.join(" ")} ${
    form.value.dev || ""
  }`;
  dialogVisible.value = true;
  // copyResult(codeRight.value);
}
</script>

<style scoped>
.wrapper {
  grid-template-columns: 1fr 210px 1fr;
}
.package-to-cli {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
