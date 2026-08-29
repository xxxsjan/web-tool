<template>
    <div id="particles-js"></div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()
const { theme } = storeToRefs(themeStore)

function readIsDark() {
    if (typeof document === 'undefined') return true
    const dataTheme = document.documentElement.getAttribute('data-theme')
    if (dataTheme === 'light' || dataTheme === 'dark') {
        return dataTheme === 'dark'
    }
    return document.documentElement.classList.contains('dark')
}

function getParticlesConfig(dark) {
    const particleColor = dark ? '#a6adbb' : '#333'
    return {
        particles: {
            number: {
                value: 111,
                density: {
                    enable: true,
                    value_area: 800,
                },
            },
            color: {
                value: particleColor,
            },
            shape: {
                type: 'circle',
                stroke: {
                    width: 0,
                    color: '#000000',
                },
                polygon: {
                    nb_sides: 5,
                },
                image: {
                    src: 'img/github.svg',
                    width: 100,
                    height: 100,
                },
            },
            opacity: {
                value: dark ? 0.45 : 0.5,
                random: false,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false,
                },
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false,
                },
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: particleColor,
                opacity: dark ? 0.35 : 0.4,
                width: 1,
            },
            move: {
                enable: true,
                speed: 3,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200,
                },
            },
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab',
                },
                onclick: {
                    enable: true,
                    mode: 'push',
                },
                resize: true,
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1,
                    },
                },
                bubble: {
                    distance: 400,
                    size: 40,
                    duration: 2,
                    opacity: 8,
                    speed: 3,
                },
                repulse: {
                    distance: 200,
                    duration: 0.4,
                },
                push: {
                    particles_nb: 4,
                },
                remove: {
                    particles_nb: 2,
                },
            },
        },
        retina_detect: true,
    }
}

function destroyParticles() {
    if (typeof window === 'undefined') return
    if (window.pJSDom && window.pJSDom.length) {
        ;[...window.pJSDom].forEach((instance) => {
            try {
                instance?.pJS?.fn?.vendors?.destroypJS?.()
            } catch {
                // ignore
            }
        })
        window.pJSDom = []
    }
    const el = document.querySelector('#particles-js')
    if (el) {
        el.innerHTML = ''
    }
}

function initParticles(dark = readIsDark()) {
    const el = document.querySelector('#particles-js')
    if (!el || typeof particlesJS !== 'function') return
    destroyParticles()
    particlesJS('particles-js', getParticlesConfig(dark))
}

onMounted(() => {
    // 以 html[data-theme] 为准（默认 dark，且早于 Vue hydrate 已写入）
    initParticles(readIsDark())
})

watch(theme, (mode) => {
    initParticles(mode === 'dark')
})

onBeforeUnmount(() => {
    destroyParticles()
})
</script>

<style>
/* 默认暗色，与站点默认主题一致；亮色由 html[data-theme] 驱动，不依赖 Vue class */
#particles-js {
    position: fixed;
    width: 100%;
    height: 100%;
    background-color: #1d232a;
    background-image: url('');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 50% 50%;
    inset: 0;
    z-index: -2;
    transition: background-color 0.2s ease;
}

html[data-theme='light'] #particles-js {
    background-color: #fff;
}
</style>
