# Web Tool Box 网页工具箱

一个集成多种实用开发工具的在线网站。

## 功能特性

### 代码转换工具

- **VSCode 代码片段生成器**：自定义生成 VSCode 的用户代码片段
- **CSS 转换器**：CSS style 字符串转 JavaScript 对象
- **字符串转换器**：模板字符串转普通字符串
- **模块转换器**：ESM 转 CommonJS
- **Less 编译器**：Less 代码转 CSS

### 图片处理工具

- **图片边缘处理**：自动去除图片黑边
- **图标生成器**：图片转 ICO 图标
- **DOM 转图片**：将 HTML 内容转换为图片

### 开发辅助工具

- **依赖包命令生成**：npm 依赖包转安装命令
- **性能监控**：实时显示页面性能数据

## 技术栈

- 框架：Nuxt.js 3
- UI：Tailwind CSS + DaisyUI
- 图片处理：dom-to-image

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build```
