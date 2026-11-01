# Web Tool Box 网页工具箱

![Nuxt](https://img.shields.io/badge/Nuxt-3.16-green)
![Node](https://img.shields.io/badge/Node-20+-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

多功能在线工具箱，覆盖媒体处理、抖音辅助、文本编辑与开发常用能力。

## 功能特性

### 工具

- **Excalidraw 画板**：基于 Excalidraw 的独立白板
- **文本编辑**：Monaco 文本编辑器
- **SVG 预览**：实时预览与校验 SVG
- **在线预览 HTML**：粘贴 HTML/CSS 即时预览
- **Git 图床**：GitHub / Gitee 图床上传与链接生成
- **VSCode 代码片段生成**：自定义生成 VSCode snippets

### 媒体类

- **文本转语音**：Edge / 百炼 Sambert / Breeze Blue / Fish Audio 多引擎 TTS
- **GPT-SoVITS 调试**：对接本机 GPT-SoVITS api_v2
- **视频转音频**：视频提取为 MP3 / WAV / AAC
- **图片转换工具**：转 ICO、AVIF→PNG、WebP 转换、DOM→PNG
- **在线抠图**：浏览器端 AI 抠图与橡皮擦修图
- **图片去黑边**：智能裁切图片多余黑边

### 抖音类

- **抖音无水印下载**：解析并下载无水印视频
- **抖音转链**：分享文案解析为长短链与元信息
- **抖音 emoji**：表情相关辅助工具

### 娱乐类

- **IKUN 键盘**：趣味音效键盘

## 技术栈

- **核心框架**：Nuxt 3（Vue 3）+ Nitro（目标 Node 20）
- **UI**：Element Plus + Tailwind CSS
- **状态管理**：Pinia（含持久化）
- **编辑器 / 画板**：Monaco Editor、Excalidraw
- **媒体处理**：fluent-ffmpeg / ffmpeg-static、dom-to-image、@imgly/background-removal、onnxruntime-web
- **其它**：JSZip、file-saver、axios、dayjs、gsap

## 环境变量（可选）

部分 TTS / 语音能力可在服务端配置（也可在对应页面临时填写）：

| 变量 | 说明 |
| --- | --- |
| `DASHSCOPE_API_KEY` | 阿里云百炼 API Key |
| `DASHSCOPE_WORKSPACE_ID` | 百炼业务空间 ID（可选） |
| `BREEZE_API_KEY` | Breeze Blue API Key |
| `FISH_API_KEY` | Fish Audio API Key |
| `FISH_API_BASE` | Fish Audio API 根地址（可选；默认 `https://api.fish.audio`，国内不通时可填代理） |
| `GPTSOVITS_BASE_URL` | GPT-SoVITS api_v2 地址（默认 `http://127.0.0.1:9880`） |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 3030）
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 许可证

[MIT License](LICENSE)
