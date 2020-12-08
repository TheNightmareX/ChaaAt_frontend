<template>
  <router-view></router-view>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      stopSyncer: () => {},
    };
  },

  computed: {
    ...mapGetters(["authed"]),
  },

  watch: {
    authed(v) {
      v ? this.syncer() : this.stopSyncer();
    },
  },

  methods: {
    async syncer() {
      try {
        await Promise.race([
          this.$store.dispatch("syncMessages"),
          new Promise((resolve, reject) => {
            this.stopSyncer = reject;
          }),
        ]);
        this.syncer();
      } catch {
        return;
      }
    },
  },
};
</script>