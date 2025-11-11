<template>
  <div class="multi-level-check-tree pl-4">
    <!-- 递归渲染每层节点 -->
    <div v-for="node in treeData" :key="node.id" class="tree-node my-2">
      <!-- 节点头部：复选框 + 文本 + 展开/折叠图标 -->
      <div
        class="node-header flex items-center gap-2 cursor-pointer group transition-colors hover:text-blue-600"
        @click.stop="handleNodeClick(node)"
      >
        <!-- 复选框：支持半选状态 -->
        <input
          type="checkbox"
          v-model="node.checked"
          :indeterminate="node.indeterminate"
          @change="handleCheckChange(node)"
          class="node-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
        />
        <!-- 展开/折叠图标（仅含子节点时显示） -->
        <span
          v-if="node.children?.length"
          class="expand-icon text-gray-500 text-xs ml-1 transition-transform duration-200"
          @click.stop="node.expanded = !node.expanded"
        >
          {{ node.expanded ? "▼" : "▶" }}
        </span>
        <!-- 节点文本 -->
        <span
          class="node-label text-gray-800 text-sm group-hover:text-blue-600"
          >{{ node.label }}</span
        >
      </div>

      <!-- 递归渲染子节点（展开状态才显示） -->
      <div
        v-if="node.children?.length && node.expanded"
        class="child-nodes mt-1 animate-fadeIn"
      >
        <MultiLevelCheckTree
          :tree-data="node.children"
          @check-change="handleChildCheckChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import MultiLevelCheckTree from "./MultiLevelCheckTree.vue"; // 递归引用

// 1. 接收父组件传递的树形数据
const props = defineProps({
  treeData: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(
        (node) =>
          !!node.id &&
          !!node.label &&
          (node.children ? Array.isArray(node.children) : true)
      );
    },
  },
});

// 2. 暴露勾选变化事件和选中数据
const emit = defineEmits(["check-change"]);

// 3. 初始化节点状态：添加 checked/indeterminate/expanded（默认折叠）
const initNodeState = (nodes) => {
  return nodes.map((node) => {
    const newNode = {
      checked: node.checked ?? false,
      indeterminate: node.indeterminate ?? false,
      expanded: node.expanded ?? false, // 默认折叠
      ...node,
    };
    // 递归初始化子节点
    if (newNode.children?.length) {
      newNode.children = initNodeState(newNode.children);
      // 初始化时计算父节点状态（避免子父状态不一致）
      calculateParentState(newNode);
    }
    return newNode;
  });
};

// 4. 核心：计算父节点状态（半选/全选/未选）
const calculateParentState = (parentNode) => {
  if (!parentNode.children?.length) return;

  // 统计子节点勾选数量
  const checkedCount = parentNode.children.filter(
    (child) => child.checked
  ).length;
  const totalCount = parentNode.children.length;

  // 更新父节点状态
  if (checkedCount === 0) {
    // 子节点全未选：父节点未选 + 无半选
    parentNode.checked = false;
    parentNode.indeterminate = false;
  } else if (checkedCount === totalCount) {
    // 子节点全选：父节点全选 + 无半选
    parentNode.checked = true;
    parentNode.indeterminate = false;
  } else {
    // 子节点部分选：父节点半选
    parentNode.checked = false;
    parentNode.indeterminate = true;
  }

  // 向上通知父组件更新
  emit("check-change", parentNode);
};

// 5. 父节点勾选变化：同步所有子节点状态
const handleCheckChange = (node) => {
  if (node.children?.length) {
    syncChildState(node, node.checked);
  }
  emit("check-change", node);
};

// 6. 同步子节点状态（父选则子全选，父取消则子全取消）
const syncChildState = (parentNode, checkedState) => {
  parentNode.children.forEach((child) => {
    child.checked = checkedState;
    child.indeterminate = false; // 子节点同步后，半选状态清除
    // 递归同步子节点的子节点
    if (child.children?.length) {
      syncChildState(child, checkedState);
    }
  });
};

// 7. 子节点勾选变化：反向更新父节点状态
const handleChildCheckChange = (childNode) => {
  // 递归查找当前子节点的父节点
  const findParent = (nodes, targetChildId) => {
    for (const node of nodes) {
      if (node.children?.some((child) => child.id === targetChildId)) {
        return node;
      }
      if (node.children?.length) {
        const parent = findParent(node.children, targetChildId);
        if (parent) return parent;
      }
    }
    return null;
  };

  // 找到父节点后，重新计算父节点状态
  const parentNode = findParent(props.treeData, childNode.id);
  if (parentNode) {
    calculateParentState(parentNode);
  }
};

// 8. 点击节点文本触发勾选（提升交互体验）
const handleNodeClick = (node) => {
  node.checked = !node.checked;
  handleCheckChange(node); // 复用勾选逻辑
};

// 9. 初始化树形数据（添加默认状态）
const initializedTreeData = ref(initNodeState(props.treeData));

// 10. 监听父组件传递的 treeData 变化，重新初始化
watch(
  () => props.treeData,
  (newData) => {
    initializedTreeData.value = initNodeState(newData);
  },
  { deep: true }
);

// 11. 暴露“获取所有选中节点”的方法（父组件可调用）
const getSelectedNodes = () => {
  const collectSelected = (nodes) => {
    let result = [];
    nodes.forEach((node) => {
      if (node.checked) {
        result.push({
          id: node.id,
          label: node.label,
          parentId: node.parentId,
        }); // 可扩展字段
      }
      if (node.children?.length) {
        result = [...result, ...collectSelected(node.children)];
      }
    });
    return result;
  };
  return collectSelected(initializedTreeData.value);
};

// 12. 暴露组件接口（父组件通过 ref 调用）
defineExpose({
  getSelectedNodes,
  initializedTreeData,
});
</script>

<style scoped>
/* 仅补充 Tailwind 未覆盖的动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-in-out;
}
</style>
