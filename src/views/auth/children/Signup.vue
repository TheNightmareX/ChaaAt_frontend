<template>
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
        :disabled="loading"
        counter="10"
        :rules="[rules.required, rules.username]"
        autofocus
      ></v-text-field>
    </v-row>

    <v-row>
      <v-text-field
        label="密码"
        v-model="password"
        type="password"
        :disabled="loading"
        counter="20"
        :rules="[rules.required, rules.password]"
      ></v-text-field>
    </v-row>

    <v-row>
      <v-text-field
        label="确认密码"
        type="password"
        :rules="[rules.required, rules.password, rules.same('password')]"
        counter="20"
        :disabled="loading"
      ></v-text-field>
    </v-row>

    <v-row class="my-3">
      <v-btn
        color="primary"
        depressed
        block
        :disabled="loading"
        :loading="loading"
        @click="$emit('signup', { username, password })"
        >注册</v-btn
      >
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      rules: {
        required: (v) => !!v || "请填写此字段",
        username: (v) =>
          /^[0-9a-zA-Z@.+-_]{1,10}$/.test(v) ||
          "1-10个字符 只能包含：数字 字母 @ . + - _",
        password: (v) => /^.{6,20}$/.test(v) || "6-20个字符",
        same: (key) => (v) => v == this[key] || "两次输入不一致",
      },
    };
  },

  props: {
    loading: Boolean,
  },
};
</script>