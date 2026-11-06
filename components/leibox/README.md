# LeiBox 组件（仅供学习使用）

源码拉取自 [LeiBox](https://leibox.pantoria.cn)（`/ai/packages/<slug>/vue.json`，2026-11-07），
为 Vue 包完整文件。LeiBox 声明：学习用途不等于统一授权，第三方设计的权利归原权利人所有，
使用须遵守其许可。以下组件均按要求保留来源与设计署名。

## TactilePushButton（立体按压按钮）

- LeiBox 页面：https://leibox.pantoria.cn/docs/components/tactile-push-button
- 来源：社区投稿，原始 HTML/CSS 作者为 少荃（抖音：宝龙体育优品小铺），未提供独立许可证
- 本仓库改动：按钮文案 `button` → `进入`（TactilePushButtonEngine.js 内嵌 markup）

## DotMatrixTrio（点阵波纹与旋涡）

- LeiBox 页面：https://leibox.pantoria.cn/docs/animations/dot-matrix-trio
- 设计参考：Chris Halaska — https://x.com/chalaska/status/2096917032621199665
- 实现为 LeiBox 的独立 DOM/Canvas 重建，未包含原作者源码；原始设计与品牌素材许可未经验证

## 柔光跟随效果（/home 工具网格）

- 技术参考：https://leibox.pantoria.cn/docs/cards/gradient-cover-wall （渐变卡片跟随）
- 未引入其组件源码，仅在本仓库 `pages/home/index.vue` 中按其 soft-light +
  阻尼弹簧（ω=√70, damping=0.86）技术实现了鼠标跟随柔光层

## 导航滑动胶囊（AppHeader）

- 技术参考：https://leibox.pantoria.cn/docs/navigation/fluid-tooltip （流体提示气泡）
- 未引入其组件源码，仅在本仓库 `components/AppHeader.vue` 中按其
  gsap expo.out（0.43s）/ power2.out（0.15s）补间技术实现了分组间滑动的胶囊高亮

## 文件结构

- `motion-runtime.ts` — 两个组件共享的 Shadow DOM 挂载运行时
- `*.vue` — Vue 壳（props.options，onMounted 挂载，卸载时销毁）
- `*Engine.js` — 组件引擎（内嵌 markup/CSS，运行于 Shadow DOM，无全局污染）
- 依赖：仅 `vue`，无需额外安装

## 用法

组件由 Nuxt 自动注册：`<LeiboxTactilePushButton />`、`<LeiboxDotMatrixTrio />`。
内含动效，建议放在 `<ClientOnly>` 中使用。
