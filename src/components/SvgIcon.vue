<template>
  <svg aria-hidden="true" :style="getStyle" class="svg-icon">
    <use :href="symbolId" :fill="color" />
  </svg>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

export default defineComponent({
  name: 'SvgIcon',
  props: {
    prefix: {
      type: String,
      default: 'icon'
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#435B71'
      // default: '#inherit'
    },
    size: {
      type: [Number, String],
      default: 20
    }
  },
  setup(props) {
    const symbolId = computed(() => `#${props.prefix}-${props.name}`);

    const getStyle = computed(() => {
      const { size } = props;
      let s = `${size}`;
      s = `${s.replace('px', '')}px`;
      return {
        width: s,
        height: s,
        color: props.color
      };
    });
    return { symbolId, getStyle };
  }
});
</script>

<style>
.svg-icon:hover {
  cursor: pointer;
}
</style>
