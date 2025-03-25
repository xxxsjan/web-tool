<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded-lg max-w-3xl relative">
            <button class="btn btn-sm btn-circle absolute -top-3 -right-3" @click="$emit('close')">
                ✕
            </button>
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    props: ['show'], // 接收显示状态
    emits: ['close'] // 声明关闭事件
}
</script>