<template>
  <v-dialog v-model="dialog" max-width="500">
    <template #activator="{ attrs, on }">
      <slot :on="on" :attrs="attrs"></slot>
    </template>
    <v-card>
      <v-card-title>好友申请</v-card-title>
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
import * as apis from "../apis";

export default {
  name: "RelationCreationDialog",

  data: () => ({
    dialog: false,
    usernameInput: "",
    loading: false,
  }),

  methods: {
    async buildRelation() {
      if (this.usernameInput && this.$refs.form.validate()) {
        try {
          this.loading = true;
          const targetUser = (await apis.auth.retrieve(this.usernameInput)).id;
          try {
            await apis.friendRelations.create(targetUser);
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