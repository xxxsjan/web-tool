<template>
    <div class="count-particles">
        <!-- <span class="js-count-particles">--</span> -->
    </div>
</template>

<script setup>
onMounted(() => {
    let count_particles, stats, update;
    stats = window.stats = new Stats();
    // 0 - 显示 FPS (每秒帧数) 
    // 1 - 显示 MS (每帧渲染时间)
    // 2 - 显示 MB (内存占用)
    stats.setMode(0);

    // const fpsPanel = stats.domElement.children[0];
    // fpsPanel.style.backgroundColor = 'transparent';`

    stats.domElement.style.position = 'fixed';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild(stats.domElement);
    count_particles = document.querySelector('.js-count-particles');
    update = function () {
        stats.begin();
        stats.end();
        // 获取并显示粒子数量
        if (
            count_particles && window.pJSDom[0].pJS.particles &&
            window.pJSDom[0].pJS.particles.array
        ) {
            count_particles.innerText =
                window.pJSDom[0].pJS.particles.array.length;
        }
        requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
})
</script>

<style lang="scss">
.count-particles {
    //  background: #000022;
    position: absolute;
    bottom: 0px;
    right: 0;
    width: 80px;
    height: 18px;
    color: #13e8e9;
    font-size: 0.8em;
    text-align: left;
    text-indent: 4px;
    line-height: 14px;
    padding-bottom: 2px;
    font-family: Helvetica, Arial, sans-serif;
    font-weight: bold;
}

.js-count-particles {
    font-size: 1.1em;
}

#stats,
.count-particles {
    -webkit-user-select: none;
}

#stats {
    // border-radius: 3px 3px 0 0;
    overflow: hidden;
    // background-color: transparent;

    // #fpsGraph {
    // background-color: red !important;
    // }

    // #fpsGraph>span {
    // background-color: transparent !important;
    // }
}

.count-particles {
    border-radius: 0 0 3px 3px;
}
</style>