<template>
  <v-snackbar v-bind="$attrs" :color="color" v-model="show">
    {{ text }}
  </v-snackbar>
</template>

<script>
export default {
  name: "Notifier",

  data: () => ({
    color: "info",
    text: "",
    show: false,
  }),

  methods: {
    /**
     *
     * @param {string} message
     * @param {string} color
     */
    async notify(message, color = "info") {
      this.text = message;
      this.color = color;
      this.show = false;
      await this.$nextTick()
      this.show = true;
    },
  },
};
</script>