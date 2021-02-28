<template>
  <v-form ref="form" :disabled="disabled">
    <v-container>
      <v-row justify="center">
        <v-avatar color="secondary">
          <v-icon dark>mdi-clipboard-account-outline</v-icon>
        </v-avatar>
      </v-row>

      <v-row class="mt-3" justify="center">
        <div class="text-h5">注册 ChaaAt</div>
      </v-row>

      <v-row>
        <v-text-field
          label="用户名"
          v-model="username"
          counter="10"
          :rules="rules.username"
          autofocus
        ></v-text-field>
      </v-row>

      <v-row>
        <v-text-field
          label="密码"
          v-model="password"
          type="password"
          counter="20"
          :rules="rules.password"
        ></v-text-field>
      </v-row>

      <v-row>
        <v-text-field
          label="确认密码"
          type="password"
          :rules="rules.confirm"
          counter="20"
        ></v-text-field>
      </v-row>

      <v-row class="my-3">
        <v-btn
          color="primary"
          depressed
          block
          :disabled="disabled"
          :loading="loading"
          @click="signup"
        >
          注册
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
export default class Signup extends Vue {
  @Ref() form!: VForm;

  loading = false;
  locked = false;

  username = "";
  password = "";

  get rules() {
    return {
      username: [
        (v: string) => !!v || "不得为空",
        models.AuthHandler.validations.username,
      ],
      password: [
        (v: string) => !!v || "不得为空",
        models.AuthHandler.validations.password,
      ],
      confirm: [(v: string) => v == this.password || "两次输入须一致"],
    };
  }

  get disabled() {
    return this.loading || this.locked;
  }

  async signup() {
    if (!this.form.validate()) return;

    try {
      this.loading = true;

      const user = await new models.UserResourceHandler().create({
        username: this.username,
        password: this.password,
      });

      await new models.AuthHandler().login(this.username, this.password);

      this.locked = true;
      this.$emit("auth", user);
    } catch {
      this.$notifier.error("注册失败：用户已存在");
    } finally {
      this.loading = false;
    }
  }
}
</script>