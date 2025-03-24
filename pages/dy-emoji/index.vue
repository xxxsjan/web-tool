<template>
    <div class="w-full max-w-[1000px] mx-auto p-4">
        <div class="flex flex-col gap-4">
            <!-- 输入框 -->
            <textarea v-model="inputText" class="textarea textarea-bordered w-full min-h-[200px]"
                placeholder="请输入包含图片链接的文本"></textarea>

            <!-- 按钮 -->
            <div class="flex justify-center gap-4">
                <button class="btn btn-primary" @click="handleParse">解析图片</button>
                <button class="btn btn-secondary" @click="handleDownloadAll"
                    :disabled="!imageUrls.length || downloading">
                    {{ downloading ? `下载中 ${progress}%` : '打包下载' }}
                </button>
            </div>
            <!-- 图片展示区 -->
            <div class="flex flex-wrap gap-2" v-if="imageUrls.length">
                <div v-for="(url, index) in imageUrls" :key="index" class="relative group">
                    <img :src="url" class="w-[100px] h-[100px] object-cover rounded"
                        @error="handleImageError($event, index)">
                    <div
                        class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a :href="url" target="_blank" class="hover:text-blue-300">查看原图</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import domText from './dom'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
const inputText = ref(domText)
const imageUrls = ref<string[]>([])

// 新增本地存储键名
const STORAGE_KEY = 'cached-emoji-input'

// 新增挂载时读取缓存
onMounted(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
        inputText.value = cached
    }
})

function handleParse() {
    if (!inputText.value) return

    // 新增保存到本地存储
    localStorage.setItem(STORAGE_KEY, inputText.value)

    // 匹配图片URL的正则表达式
    const imgRegex = /<img[^>]+src="([^">]+)"|https?:\/\/[^<\s]+?\.(jpg|jpeg|png|gif|webp)/gi
    const matches = inputText.value.match(imgRegex) || []

    // 提取URL
    imageUrls.value = matches.map(match => {
        // 如果是img标签，提取src
        if (match.startsWith('<img')) {
            const srcMatch = match.match(/src="([^"]+)"/)
            return srcMatch ? srcMatch[1].replaceAll('amp;', '') : ''
        }
        // 如果是直接的URL
        return match
    }).filter(Boolean)
}

function handleImageError(event: Event, index: number) {
    const img = event.target as HTMLImageElement
    img.src = 'https://dummyimage.com/100x100/ccc/fff&text=加载失败'
}

const downloading = ref(false)
const progress = ref(0)

async function handleDownloadAll() {
    if (!imageUrls.value.length) return
    downloading.value = true
    progress.value = 0

    const zip = new JSZip()
    const total = imageUrls.value.length

    for (let i = 0; i < total; i++) {
        const url = imageUrls.value[i]
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const { pathname } = new URL(url)
            const filename = pathname.split('/').pop() || `image_${i + 1}`
            const extension = 'png'
            zip.file(`${filename}.${extension}`, blob)

            // 更新进度
            progress.value = Math.round(((i + 1) / total) * 100)
        } catch (error) {
            console.error('下载图片失败:', url, error)
        }
    }

    try {
        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, 'images.zip')
    } catch (error) {
        console.error('生成压缩包失败:', error)
    } finally {
        downloading.value = false
        progress.value = 0
    }
}
</script>

<style scoped>
.textarea:focus {
    outline: none;
    border-color: #3b82f6;
}
</style>