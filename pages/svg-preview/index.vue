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
                <button class="btn btn-primary" @click="parseSvg">
                    预览 SVG
                </button>
                <button class="btn btn-ghost" @click="clearAll">
                    清空
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const svgCode = ref('')
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

function clearAll() {
    svgCode.value = ''
    parsedSvg.value = ''
    error.value = ''
}
</script>

<style scoped>
.svg-preview {
    min-height: calc(100vh - 4rem);
}

.textarea {
    min-height: 400px;
    font-family: Consolas, Monaco, monospace;
    font-size: 14px;
}
</style>