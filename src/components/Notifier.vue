<template>
  <v-snackbar app top right :color="color" v-model="show">
    {{ text }}
  </v-snackbar>
</template>

<script>
export default {
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
    notify(message, color = "info") {
      this.text = message;
      this.color = color;
      this.show = false;
      this.show = true;
    },
  },
};
</script>