<template>
  <v-app>
    <v-app-bar color="primary" dark app clipped-left>
      <v-app-bar-nav-icon
        @click="navigationDrawerOpen = !navigationDrawerOpen"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>ChaaAt</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="navigationDrawerOpen" app clipped>
      <v-list class="py-0">
        <v-list-item-group>
          <v-list-item :to="{ name: 'Login', query: $route.query }">
            <v-list-item-icon>
              <v-icon>mdi-account-arrow-right</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>登录</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'Signup', query: $route.query }">
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
          <v-form ref="form">
            <router-view
              :loading="loading"
              @login="login"
              @signup="signup"
            ></router-view>
          </v-form>
        </v-card>
      </v-container>
    </v-main>

    <Notifier ref="notifier"></Notifier>
  </v-app>
</template>

<script>
import "vue-router";
import { mapActions } from "vuex";
import * as apis from "../../apis";
import Notifier from "../../components/Notifier";

export default {
  components: { Notifier },

  data: () => ({
    navigationDrawerOpen: undefined,
    loading: false,
  }),

  methods: {
    ...mapActions({ performLogin: "login" }),
    /**
     *
     * @param {string} msg
     */
    alert(msg) {
      this.$refs.notifier.notify(msg, "warning");
    },
    async login({ username, password }) {
      if (!this.$refs.form.validate()) return;
      try {
        this.loading = true;
        await this.performLogin({ username, password });
        this.next();
      } catch {
        this.alert("用户名或密码错误");
      } finally {
        this.loading = false;
      }
    },
    async signup({ username, password }) {
      if (!this.$refs.form.validate()) return;
      try {
        this.loading = true;
        await apis.auth.signup(username, password);
        await this.performLogin({ username, password });
        this.next();
      } catch {
        this.alert("用户名已存在");
      } finally {
        this.loading = false;
      }
    },
    next() {
      const next = this.$route.query.next;
      this.$router.push(next ? { path: next } : { name: "Chatrooms" });
    },
  },
};
</script>

<style scoped>
.card {
  width: 400px;
  margin-top: 100px;
}
</style>