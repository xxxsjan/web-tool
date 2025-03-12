<template>

    <div id="particles-js"></div>
</template>


<script setup>
onMounted(() => {
    const el = document.querySelector('#particles-js');
    if (!el) {
        return
    }
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 111,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            // 点颜色
            color: {
                value: '#333'
            },
            shape: {
                type: 'circle',
                stroke: {
                    width: 0,
                    color: '#000000'
                },
                polygon: {
                    nb_sides: 5
                },
                image: {
                    src: 'img/github.svg',
                    width: 100,
                    height: 100
                }
            },
            opacity: {
                value: 0.5,
                random: false,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: 3,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false
                }
            },
            // 连线
            line_linked: {
                enable: true,
                distance: 150,
                color: '#333',
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 6,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200
                }
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            },
            modes: {
                grab: {
                    distance: 140,
                    line_linked: {
                        opacity: 1
                    }
                },
                bubble: {
                    distance: 400,
                    size: 40,
                    duration: 2,
                    opacity: 8,
                    speed: 3
                },
                repulse: {
                    distance: 200,
                    duration: 0.4
                },
                push: {
                    particles_nb: 4
                },
                remove: {
                    particles_nb: 2
                }
            }
        },
        retina_detect: true
    });


    // function v50() {
    //     let arr = [
    //         [1, 9, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22],
    //         [2, 8, 12, 18, 22],
    //         [3, 7, 12, 13, 14, 15, 16, 18, 22],
    //         [4, 6, 16, 18, 22],
    //         [5, 5, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22]
    //     ];
    //     let str = '';
    //     for (let i = 0; i < arr.length; i++) {
    //         for (j = 0; j < 30; j++) {
    //             if (arr[i].indexOf(j) > -1) {
    //                 str += '█';
    //             } else {
    //                 str += ' ';
    //             }
    //         }
    //         str += '\n';
    //     }
    //     return str;
    // }
    // console.log(v50());
})
</script>

<style>
#particles-js {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #fff;
    background-image: url('');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: 50% 50%;

    inset: 0;
    z-index: -2;
}
</style>