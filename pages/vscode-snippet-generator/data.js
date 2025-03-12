const demoList = [
  {
    code: `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        
        <body>
            <script type="importmap">
                        {
                    "imports": {"vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"} 
                }
            </script>
            <div id="app" style="column-count: 3;">
                <div class="w-full columns-3">
                    <img class="w-full  " v-for="(item, index) in 100" :key="index" :data-index="index"
                        data-src="https://picsum.photos/200/300" src="https://picsum.photos/200/300" />
                </div>
            </div>
            <script type="module">
                import { createApp } from "vue"
                createApp({
                    setup() {
        
                    }
                }).mount("#app")
            </script>
        </body>
        
</html>`,
    snippetName: 'html-tailwind',
    prefix: 'html-tailwind',
    description: 'tailwind html模板',
  },
  {
    snippetName: 'vue3-setup',
    prefix: 'v3-setup',
    description: 'Vue3 setup模板',
    code: `<template>
    <div>

    </div>
</template>

<script setup>

</script>

<style lang="scss" scoped>

</style>
    `,
  },
  {
    snippetName:'vue3-ts',
    prefix: 'vue3-ts',
    description: 'vue3 ts模板',
    code:`<template>
    <div>

    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    setup () {
        

        return {}
    }
})
</script>

<style scoped>

</style>`
  },
];

export default demoList;
