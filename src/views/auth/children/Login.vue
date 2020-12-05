<template>
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
        :disabled="loading"
        :rules="[rules.required]"
        autofocus
      ></v-text-field>
    </v-row>

    <v-row>
      <v-text-field
        v-model="password"
        type="password"
        label="密码"
        :disabled="loading"
        :rules="[rules.required]"
      ></v-text-field>
    </v-row>

    <v-row class="my-3">
      <v-btn
        color="primary"
        depressed
        block
        :disabled="loading"
        :loading="loading"
        @click="$emit('login', { username, password })"
        >登录</v-btn
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
      },
    };
  },

  props: {
    loading: Boolean,
  },
};
</script>