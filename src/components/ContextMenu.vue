<template>
  <v-menu v-model="shown" :position-x="x" :position-y="y" absolute>
    <slot :shown="shown"></slot>
  </v-menu>
</template>

<script>
export default {
  name: "ContextMenu",

  data: () => ({
    shown: false,
    x: 0,
    y: 0,
  }),

  methods: {
    /**
     *
     * @param {MouseEvent} e
     */
    async show(e) {
      this.shown = false;
      this.x = e.clientX;
      this.y = e.clientY;
      await this.$nextTick();
      this.shown = true;
    },
  },
};
</script>