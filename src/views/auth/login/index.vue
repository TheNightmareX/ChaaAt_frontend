<template>
  <v-form ref="form" :disabled="disabled">
    <v-container>
      <v-row justify="center">
        <v-avatar color="secondary">
          <v-icon dark>mdi-lock-outline</v-icon>
        </v-avatar>
      </v-row>

      <v-row class="mt-3" justify="center">
        <div class="text-h5">登录 ChaaAt</div>
      </v-row>

      <v-row>
        <v-text-field
          v-model="username"
          label="用户名"
          :rules="[(v) => !!v || '不得为空']"
          autofocus
        ></v-text-field>
      </v-row>

      <v-row>
        <v-text-field
          v-model="password"
          type="password"
          label="密码"
          :rules="[(v) => !!v || '不得为空']"
        ></v-text-field>
      </v-row>

      <v-row class="my-3">
        <v-btn
          color="primary"
          depressed
          block
          :loading="loading"
          :disabled="disabled"
          @click="login"
        >
          登录
        </v-btn>
      </v-row>
    </v-container>
  </v-form>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Ref, Vue } from "vue-property-decorator";
import { VForm } from "vuetify/components";

@Component
export default class Login extends Vue {
  @Ref() form!: VForm;

  loading = false;
  locked = false;

  username = "";
  password = "";

  get disabled() {
    return this.loading || this.locked;
  }

  async login() {
    this.form.validate();

    try {
      this.loading = true;

      const authInfo = await new models.AuthHandler().login(
        this.username,
        this.password
      );

      const user = await new models.UserResourceHandler().retrieve(authInfo.pk);

      this.locked = true;
      this.$emit("auth", user);
    } catch {
      this.$notifier.error("认证失败：用户名或密码错误");
    } finally {
      this.loading = false;
    }
  }
}
</script>