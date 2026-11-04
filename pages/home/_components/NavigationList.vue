<template>
  <div class="relative">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-transparent to-transparent dark:from-sky-950/30"
    />

    <div class="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div v-if="toolList.length" class="mb-5 flex justify-end">
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {{ toolList.length }} 个工具
        </div>
      </div>

      <section
        v-for="p in groupedTools"
        :key="p.group"
        class="mb-5 last:mb-0"
      >
        <div class="mb-2 flex items-center gap-2">
          <h3
            class="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide"
          >
            {{ p.group }}
          </h3>
          <div class="h-px flex-1 bg-gray-200/80 dark:bg-gray-800" />
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          <button
            v-for="item in p.list"
            :key="item.path"
            type="button"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
              bg-white/90 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800
              hover:border-sky-300/60 dark:hover:border-sky-500/40 hover:bg-white dark:hover:bg-gray-900
              hover:shadow-sm active:scale-[0.99] cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70
              transition-all duration-150 ease-out"
            @click="goTool(item.path)"
          >
            <ToolOutlineIcon
              :name="item.icon"
              class="shrink-0"
            />

            <div class="min-w-0 flex-1">
              <div
                class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate leading-tight"
              >
                {{ item.label }}
              </div>
            </div>
          </button>
        </div>
      </section>

      <p
        v-if="!toolList.length"
        class="rounded-xl border border-dashed border-gray-300/80 dark:border-gray-700 py-12 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        暂无已注册工具
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToolNav } from '~/composables/useToolNav';

const { toolList, groupedTools, goTool } = useToolNav();
</script>
