<template>
  <v-dialog v-model="dialog" max-width="500">
    <template #activator="{ attrs, on }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>关系申请</v-card-title>
      <v-card-text>
        <v-form ref="form" :disabled="loading" @submit.prevent="buildRelation">
          <v-text-field
            autofocus
            v-model="usernameInput"
            :loading="loading"
            label="对方用户名"
            hint="按下 Enter 提交"
            counter="10"
            :rules="[(v) => !v || v.length <= 10 || '不多于十个字符']"
          ></v-text-field>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { friendRelations, auth } from "../apis";

export default {
  name: "FriendCreationBtn",

  data() {
    return {
      dialog: false,
      usernameInput: "",
      loading: false,
    };
  },

  methods: {
    async buildRelation() {
      if (this.usernameInput && this.$refs.form.validate()) {
        try {
          this.loading = true;
          const targetUser = (await auth.retrieve(this.usernameInput)).id;
          try {
            await friendRelations.create(targetUser);
            this.$emit("success");
          } catch {
            this.$emit("error", "联系人已存在或待同意");
          }
        } catch {
          this.$emit("error", "目标用户不存在");
        } finally {
          this.loading = false;
          this.dialog = false;
        }
      }
    },
  },
};
</script>