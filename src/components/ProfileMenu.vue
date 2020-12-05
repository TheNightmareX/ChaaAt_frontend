<template>
  <v-menu offset-y transition="scale-transition" origin="top right">
    <template #activator="{ attrs, on }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-account</v-icon>
      </v-btn>
    </template>

    <v-list>
      <v-list-item>
        <v-list-item-avatar>
          <v-icon x-large>mdi-account-circle</v-icon>
        </v-list-item-avatar>
        <v-list-item-title>{{ user.username }}</v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <v-list-item @click="logout">
        <v-list-item-icon>
          <v-icon>mdi-exit-to-app</v-icon>
        </v-list-item-icon>
        <v-list-item-title>退出登录</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import "vue-router";
import { mapState } from "vuex";

export default {
  name: "ProfileMenu",

  computed: {
    ...mapState(["user"]),
  },

  methods: {
    async logout() {
      await this.$store.dispatch("logout");
      this.$router.push({ name: "Login", query: { next: location.pathname } });
    },
  },
};
</script>