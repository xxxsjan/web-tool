<template>
  <div class="container mx-auto px-4 py-8 max-w-3xl">
    <h3 class="text-xl font-semibold text-gray-800 mb-6">商品分类多层勾选</h3>

    <!-- 多层勾选组件 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <MultiLevelCheckTree
        :tree-data="productCategoryTree"
        ref="checkTreeRef"
      />
    </div>

    <!-- 操作按钮与选中结果展示 -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <button
        @click="showSelectedNodes"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        查看选中分类
      </button>

      <!-- 选中结果（响应式布局：小屏垂直排列，大屏水平排列） -->
      <div
        v-if="selectedNodes.length"
        class="mt-4 sm:mt-0 flex flex-wrap gap-2"
      >
        <span class="text-sm text-gray-600">已选中：</span>
        <span
          v-for="node in selectedNodes"
          :key="node.id"
          class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
        >
          {{ node.label }} ({{ node.id }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import MultiLevelCheckTree from "./MultiLevelCheckTree.vue";

// 1. 模拟多层树形数据（实际项目从接口获取）
const productCategoryTree = ref([
  {
    id: 1,
    label: "电子产品",
    children: [
      {
        id: 11,
        label: "手机",
        children: [
          { id: 111, label: "智能手机" },
          { id: 112, label: "功能手机" },
        ],
      },
      {
        id: 12,
        label: "电脑",
        children: [
          { id: 121, label: "笔记本" },
          { id: 122, label: "台式机" },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "家居用品",
    children: [
      { id: 21, label: "家具" },
      { id: 22, label: "家电" },
    ],
  },
  {
    id: 3,
    label: "服饰鞋帽",
    children: [
      {
        id: 31,
        label: "服装",
        children: [
          { id: 311, label: "上衣" },
          { id: 312, label: "裤子" },
        ],
      },
      { id: 32, label: "鞋子" },
    ],
  },
]);

// 2. 引用组件与存储选中结果
const checkTreeRef = ref(null);
const selectedNodes = ref([]);

// 3. 获取并展示选中节点
const showSelectedNodes = () => {
  selectedNodes.value = checkTreeRef.value.getSelectedNodes();
};
</script>
