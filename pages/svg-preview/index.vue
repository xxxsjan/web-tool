<template>
    <div class="svg-preview w-full max-w-[1200px] mx-auto p-4">
        <div class="flex flex-col gap-4 h-[80vh]">
            <!-- 输入区域 -->
            <div class="flex-1 flex gap-4">
                <textarea v-model="svgCode" class="textarea textarea-bordered flex-1 resize-none"
                    placeholder="请输入 SVG 代码"></textarea>

                <!-- 预览区域 -->
                <div class="flex-1 bg-gray-100 p-4 rounded-lg border border-dashed border-gray-300">
                    <div class="w-full h-full flex items-center justify-center" v-html="parsedSvg" v-if="!error"></div>
                    <div v-else class="text-red-500 text-center">
                        {{ error }}
                    </div>
                </div>
            </div>

            <!-- 控制按钮 -->
            <div class="flex justify-center gap-4">
                <button class="btn btn-primary" @click="parseSvg">预览 SVG</button>

                <button class="btn btn-secondary" :disabled="!parsedSvg" popovertarget="popover-1"
                    style="anchor-name:--anchor-1">保存为...</button>
                <ul class="dropdown menu p-2 shadow bg-base-100 rounded-box w-52" popover id="popover-1"
                    style="position-anchor:--anchor-1">
                    <li><a @click.prevent="saveFile('png')">PNG 图片</a></li> <!-- 添加 .prevent 修饰符 -->
                    <li><a @click.prevent="saveFile('svg')">SVG 文件</a></li> <!-- 添加 .prevent 修饰符 -->
                </ul>

                <button class="btn btn-ghost" @click="clearAll">清空</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const svgCode = ref(``)
const parsedSvg = ref('')
const error = ref('')

function parseSvg() {
    error.value = ''
    try {
        if (!svgCode.value) {
            throw new Error('请输入 SVG 代码')
        }

        // 增强的 SVG 格式验证
        if (!/^\s*<svg[\s>]/i.test(svgCode.value)) {
            throw new Error('必须以 <svg> 标签开头')
        }
        if (!/<\/svg>\s*$/i.test(svgCode.value)) {
            throw new Error('必须以 </svg> 标签结尾')
        }

        // 更精准的安全过滤
        const sanitized = svgCode.value
            .replace(/<script[\s\S]*?<\/script>/gi, '') // 移除所有 script 标签
            .replace(/on\w+="[^"]*"/gi, '') // 移除事件处理器
            .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/</g, '&lt;')) // 处理 CDATA

        parsedSvg.value = sanitized
    } catch (err) {
        error.value = '解析失败：' + err.message
        parsedSvg.value = ''
    }
}


async function saveFile(format: 'png' | 'svg') {
    console.log('保存格式:', format)  // 调试点击事件是否触发
    console.log('当前SVG内容:', parsedSvg.value) // 检查内容是否有效
    try {
        if (format === 'png') {
            await saveAsImage()
        } else {
            await saveAsSVG()
        }
    } catch (err) {
        console.error('保存错误:', err) // 捕获未处理的异常
        error.value = '保存失败: ' + err.message
    }
}

async function saveAsSVG() {
    try {
        const blob = new Blob([parsedSvg.value], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `svg_export_${Date.now()}.svg`
        link.href = url
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
        error.value = 'SVG保存失败: ' + err.message
    }
}

// 修改现有保存函数名称
async function saveAsImage() {
    try {
        const svgElement = document.createElement('div')
        svgElement.innerHTML = parsedSvg.value
        const svgNode = svgElement.querySelector('svg')

        if (!svgNode) {
            throw new Error('未找到有效的 SVG 元素')
        }

        // 使用 XMLSerializer 序列化
        const serializer = new XMLSerializer()
        const svgStr = serializer.serializeToString(svgNode)
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        // 预加载校验
        await new Promise((resolve, reject) => {
            const testImg = new Image()
            testImg.onload = () => {
                URL.revokeObjectURL(url)
                resolve(true)
            }
            testImg.onerror = () => {
                URL.revokeObjectURL(url)
                reject(new Error('SVG 内容无效或包含不安全元素'))
            }
            testImg.src = url
        })

        // 获取尺寸（添加 viewBox 解析）
        const viewBox = svgNode.getAttribute('viewBox')
        const [, , vw, vh] = viewBox ? viewBox.split(/\s+|,/) : []
        const width = parseInt(svgNode.getAttribute('width')) || parseInt(vw) || 800
        const height = parseInt(svgNode.getAttribute('height')) || parseInt(vh) || 600

        // 绘制到 canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
            img.onload = () => {
                ctx?.drawImage(img, 0, 0, width, height)
                resolve(true)
            }
            img.onerror = reject
            img.src = URL.createObjectURL(svgBlob)
        })

        // 触发下载
        const link = document.createElement('a')
        link.download = `svg_export_${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    } catch (err) {
        error.value = '保存失败: ' + err.message
    }
}

function clearAll() {
    svgCode.value = ''
    parsedSvg.value = ''
    error.value = ''
}
</script>

<style scoped>
/* 新增下拉菜单修复 */
.dropdown-content {
    z-index: 10;
}

.dropdown:focus-within .dropdown-content {
    display: block;
}

.svg-preview {
    min-height: calc(100vh - 4rem);
}

.textarea {
    min-height: 400px;
    font-family: Consolas, Monaco, monospace;
    font-size: 14px;
}
</style>