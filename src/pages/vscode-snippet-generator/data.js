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
    description: 'html with tailwind',
  },
];

export default demoList;
