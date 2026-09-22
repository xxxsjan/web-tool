<template>
  <div class="relative px-[6vw] py-20 mx-auto box-sizing-border">
    <div class="relative" v-for="(p, idx) in groupedTools" :key="idx">
      <h3
        class="text-xl font-bold text-gray-800 dark:text-white mb-6 ml-2 border-l-4 border-blue-500 pl-3 transition-all duration-300 hover:border-blue-600"
      >
        {{ p.group }}
      </h3>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-4"
      >
        <div
          v-for="item in p.list"
          :key="item.path"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1 border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
          @click="goTool(item.path)"
        >
          <div class="p-6 flex items-center">
            <div
              class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300"
            >
              {{ item.icon }}
            </div>
            <h2
              class="text-lg text-gray-700 dark:text-gray-200 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate"
            >
              {{ item.label }}
            </h2>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToolNav } from '~/composables/useToolNav';

const { groupedTools, goTool } = useToolNav();
</script>
