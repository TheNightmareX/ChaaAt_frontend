<template>
  <div
    ref="div"
    v-text="text"
    :style="{
      width: `${width}px`,
      'line-height': `${ROW_HEIGHT}px`,
      position: 'fixed',
      top: '100%',
      left: '100%',
      'white-space': 'pre-wrap',
      'overflow-wrap': 'break-word',
    }"
    v-mutate.child="() => $emit('input', calculateRows())"
  ></div>
</template>

<script>
export default {
  name: "TextRowsCalculator",

  data: () => ({
    width: 0,
    ROW_HEIGHT: 20,
  }),

  props: {
    text: String,
    target: undefined,
    widthOffset: { type: Number, default: 0 },
  },

  watch: {
    target() {
      this.updateWidth();
    },
  },

  methods: {
    updateWidth() {
      /**@type {HTMLElement} */
      const elDOM = this.target?.$el ?? this.target;
      this.width = (elDOM?.offsetWidth ?? this.widthOffset) - this.widthOffset;
    },
    calculateRows() {
      const inaccurateRows = this.$refs["div"].offsetHeight / this.ROW_HEIGHT;
      const needAdjustment = !this.text.split("\n").slice(-1)[0]; // the last line is empty
      return needAdjustment ? inaccurateRows + 1 : inaccurateRows;
    },
  },

  created() {
    this.updateWidth();
  },
};
</script>