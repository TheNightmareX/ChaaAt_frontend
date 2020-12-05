<template>
  <router-view></router-view>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters(["authed"]),
  },

  watch: {
    authed(v) {
      if (v) this.syncer();
    },
  },

  methods: {
    async syncer() {
      if (!this.authed) return;
      try {
        await this.$store.dispatch("syncMessages");
      } finally {
        this.syncer();
      }
    },
  },
};
</script>