<template>
  <v-menu v-bind="$attrs">
    <template #activator="{ attrs, on }">
      <slot :attrs="attrs" :on="on"></slot>
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
import { mapState, mapActions } from "vuex";

export default {
  name: "ProfileMenu",

  computed: {
    ...mapState(["user"]),
  },

  methods: {
    ...mapActions({ performLogout: "logout" }),
    async logout() {
      await this.performLogout("logout");
      this.$router.push({ name: "Login", query: { next: location.pathname } });
    },
  },
};
</script>