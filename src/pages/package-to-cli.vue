<template>
  <LeftToRight
    v-model:codeLeft="codeLeft"
    v-model:codeRight="codeRight"
    @toGenerate="toGenerate"
  >
    <el-form :model="form" label-width="60px">
      <el-form-item label="包">
        <el-radio-group v-model="form.npmName">
          <el-radio label="npm" />
          <el-radio label="pnpm" />
          <el-radio label="yarn" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="环境">
        <el-radio-group v-model="form.dev">
          <el-radio label="-S" />
          <el-radio label="-D" />
        </el-radio-group>
      </el-form-item>
    </el-form>
  </LeftToRight>
</template>

<script setup>
defineOptions({
  name: "package-to-cli",
});
const form = ref({ npmName: "pnpm", dev: "-S" });
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
  const firmText = code.replace(/\s|\{|\}/g, "");
  console.log("firmText: ", firmText);
  const data = firmText.split(",").reduce((pre, cur) => {
    if (cur) {
      const mat = cur.match(/"(.*?)":"\^?(.*?)"/);
      if (mat) {
        const [a, name, version] = mat;
        pre.push(`${name}@${version}`);
      }
    }
    return pre;
  }, []);
  console.log("data: ", data);

  codeRight.value = `${form.value.npmName} ${
    form.value.npmName === "npm" ? "i" : "add"
  } ${data.join(" ")} ${form.value.dev || ""}`;

  copyResult(codeRight.value);
}
const glp = getCurrentInstance().appContext.config.globalProperties;

const copyResult = (coptText) => {
  console.log("coptText: ", coptText);
  if (coptText && navigator.clipboard) {
    console.log("navigator.clipboard: ", navigator.clipboard);
    navigator.clipboard.writeText(coptText);
    glp.$message.success("结果已自动复制到粘贴板");
  }
};
</script>

<style scoped>
.wrapper {
  grid-template-columns: 1fr 210px 1fr;
}
</style>
