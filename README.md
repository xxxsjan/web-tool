# Web Tool Box 网页工具箱

![Nuxt](https://img.shields.io/badge/Nuxt-3.8.2-green)
![Node](https://img.shields.io/badge/Node-18.17.1-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

🔧 开发者必备的多功能在线工具箱，整合高频使用的代码转换、图片处理工具链

## 功能特性

### 代码转换工具

- **VSCode 代码片段生成器**：自定义生成 VSCode 的用户代码片段
- **CSS 转换器**：CSS style 字符串转 JavaScript 对象
- **字符串转换器**：模板字符串转普通字符串
- **模块转换器**：ESM 转 CommonJS
- **Less 编译器**：Less 代码转 CSS
- **Vue转JSX**：Vue 模板语法转 JSX 语法
- **路径转换**：Windows 路径与 Unix 路径互转
- **驼峰转换**：下划线命名与驼峰命名互转

### 图片处理工具

- **智能去边工具**：自动去除图片多余黑边
- **图标转换器**：图片转 ICO 格式图标
- **DOM转图片**：HTML 内容转 PNG/JPG 图片
- **图片链接解析**：提取文本中的图片链接并支持批量下载
- **网页图片批量打开器**：按指定间隔批量打开图片链接
- **SVG预览器**：实时预览和验证 SVG 代码

### 开发辅助工具

- **依赖包命令生成**：npm 依赖包转安装命令
- **性能监控**：实时显示页面性能数据
- **粒子效果**：页面粒子动画效果展示

## 技术栈

- **核心框架**: Nuxt.js 3 (基于 Vue 3 的 SSR 框架)
- **UI 组件**:
  - DaisyUI (导航栏、卡片布局、主题切换)
  - Element Plus (表单控件、对话框、通知组件)
- **样式方案**: Tailwind CSS + PostCSS (原子化样式系统)
- **图片处理**:
  - dom-to-image (DOM转PNG/JPG)
  - sharp (高性能图片处理)
- **工具库**:
  - JSZip (前端文件压缩)
  - file-saver (浏览器文件保存)
  - marked (Markdown解析)
- **代码质量**: ESLint + Prettier (代码规范)

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build


## 许可证

[MIT License](LICENSE)```
