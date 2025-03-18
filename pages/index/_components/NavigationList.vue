<template>
    <div class="index_page px-[6vw]">
        <div class="nya-container">
            <div class="nya-title">
                <i class="eva eva-thermometer-plus-outline"></i><span>工具</span>
            </div>
            <div class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div class="card w-hull bg-base-100 shadow-xl sm:mr-4 mb-4" v-for="(item, index) in list" :key="index"
                    @click="go(item.path)">
                    <div class="card-body">
                        <h2 class="card-title">
                            {{ item?.meta?.title || item.meta?.name || item.name }}
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'nuxt/app';
const router = useRouter();
const pageModule = import.meta.glob('/pages/**/page.js', {
    eager: true,
    import: 'default'
});
interface RouteItem {
    path: string
    name: string
    meta?: {
        title?: string
        name?: string
    }
}

const autoRoutes = Object.entries(pageModule)
    .map(([pageJsPath, meta]): RouteItem => {
        console.log('pageJsPath: ', pageJsPath);
        const pageName = pageJsPath.replace(/^\/pages\/(.+)\/page\.js$/, '$1');

        const routePathArr = pageName.split('/');
        const name = routePathArr[routePathArr.length - 1];

        return {
            path: '/' + pageName,
            name,
            meta
        };
    })

const list: RouteItem[] = [
    ...autoRoutes,
    {
        path: '/html/text-reading.html',
        name: '🔊文字朗读',
    }
]

async function go(path: string) {
    try {
        // 确保路径以斜杠开头
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;

        if (normalizedPath.includes('.html')) {
            window.open(normalizedPath);
        } else {
            await router.push(normalizedPath);
        }
    } catch (error) {
        console.error('Navigation failed:', error);
    }
}
</script>

<style lang="scss" scoped>
.index_page {
    position: relative;
    box-sizing: border-box;
    margin: 88px auto;

    --theme: #249ffd;
    --color-text: #2f3e4c;
}

.nya-container {
    position: relative;
}

.nya-container .nya-title {
    background-color: var(--theme);
    border-radius: 0.5rem;
    box-shadow: 0 0.3125rem 0.5rem rgba(36, 159, 253, 0.302);
    color: #fff;
    font-size: 0;
    font-weight: 700;
    left: 1.875rem;
    padding: 0.5rem 0.9375rem;
    position: absolute;
    top: -3rem;
}

.nya-container .nya-title i {
    font-size: 1.25rem;
    margin-right: 0.3125rem;
    vertical-align: middle;
}

.nya-container .nya-title span {
    font-size: 1.0625rem;
    line-height: 1.25rem;
    vertical-align: middle;
}
</style>