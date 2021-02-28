<template>
  <v-sheet>
    <v-app-bar color="primary" dark app clipped-left>
      <v-app-bar-nav-icon
        @click="navigationDrawerOpen = !navigationDrawerOpen"
      ></v-app-bar-nav-icon>

      <v-toolbar-title>ChaaAt</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="navigationDrawerOpen" app clipped>
      <v-list class="py-0">
        <v-list-item-group mandatory>
          <v-list-item :to="{ name: 'Login' }">
            <v-list-item-icon>
              <v-icon>mdi-account-arrow-right</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>登录</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'Signup' }">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>注册</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container class="pa-5">
        <v-card class="card pa-5 mx-auto">
          <router-view @auth="auth"></router-view>
        </v-card>
      </v-container>
    </v-main>
  </v-sheet>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Vue } from "vue-property-decorator";
import { Location, NavigationGuardNext } from "vue-router";

@Component
export default class Auth extends Vue {
  navigationDrawerOpen: boolean | null = null;

  auth(user: models.User) {
    this.$context.user = user;
    this.$router.push({ name: "Index" });
  }

  /**
   * Prevent duplicate login.
   *
   * By redirecting to where the user came from if already authenticated.
   */
  beforeRouteEnter(to: Location, from: Location, next: NavigationGuardNext) {
    next(async (vm_) => {
      const vm = vm_ as Auth;
      await vm.$nextTick();
      if (vm.$context.user) {
        vm.$router.push(from);
      }
    });
  }
}
</script>

<style scoped>
.card {
  width: 400px;
  margin-top: 100px;
}
</style>