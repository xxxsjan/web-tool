<template>
  <div class="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
    <header class="mb-10 max-w-2xl">
      <p class="mb-2 text-sm text-base-content/50">欢迎回来</p>
      <h1 class="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        工具台
      </h1>
      <p class="mt-3 text-base leading-relaxed text-base-content/65">
        从顶部菜单进入各分类，或在下方浏览全部工具。当前共
        <span class="font-medium text-base-content">{{ toolList.length }}</span>
        个工具，分属
        <span class="font-medium text-base-content">{{ groupedTools.length }}</span>
        个分组。
      </p>
    </header>

    <section
      v-for="group in groupedTools"
      :key="group.group"
      class="mb-10 last:mb-0"
    >
      <div class="mb-4 flex items-baseline gap-3">
        <h2 class="text-lg font-semibold text-base-content">
          {{ group.group }}
        </h2>
        <span class="text-xs text-base-content/40">
          {{ group.list.length }} 项
        </span>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="item in group.list"
          :key="item.path"
          type="button"
          class="group flex items-center gap-3 rounded-2xl border border-base-300/70 bg-base-100/70 px-4 py-3.5 text-left transition
                 hover:border-primary/40 hover:bg-base-200/60"
          @click="goTool(item.path)"
        >
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-200 text-xl transition group-hover:scale-105"
          >
            {{ item.icon }}
          </span>
          <span class="min-w-0">
            <span
              class="block truncate font-medium text-base-content group-hover:text-primary"
            >
              {{ item.label }}
            </span>
            <span class="mt-0.5 block truncate text-xs text-base-content/45">
              {{ item.path }}
            </span>
          </span>
        </button>
      </div>
    </section>

    <p
      v-if="!toolList.length"
      class="rounded-2xl border border-dashed border-base-300 px-4 py-10 text-center text-sm text-base-content/50"
    >
      暂无已注册工具
    </p>
  </div>
</template>

<script setup lang="ts">
import { useToolNav } from '~/composables/useToolNav';

const { toolList, groupedTools, goTool } = useToolNav();
</script>
