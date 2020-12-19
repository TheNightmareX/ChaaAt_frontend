<template>
  <v-dialog v-model="visible" max-width="500">
    <template #activator="{ attrs, on }">
      <slot :on="on" :attrs="attrs"></slot>
    </template>
    <v-card>
      <v-card-title>好友申请</v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="buildRelation">
          <v-autocomplete
            :search-input.sync="username"
            :items="users"
            :loading="loading"
            no-data-text="搜索无结果"
            cache-items
            autofocus
            label="用户名"
            hint="按下 Enter 提交"
          ></v-autocomplete>
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
    visible: false,
    username: "",
    users: [],
    loading: false,
  }),

  watch: {
    username(v) {
      setTimeout(async () => {
        if (v != this.username || this.loading) return;
        this.loading = true;
        this.users = (await apis.auth.list(v)).results.map(
          (user) => user.username
        );
        this.loading = false;
      }, 200);
    },
  },

  methods: {
    async buildRelation() {
      if (this.username && this.$refs.form.validate()) {
        try {
          this.loading = true;
          const targetUser = (await apis.auth.retrieve(this.username)).id;
          try {
            await apis.friendRelations.create(targetUser);
            this.$emit("success");
          } catch {
            this.$emit("error", "联系人已存在或待通过");
          }
        } catch {
          this.$emit("error", "目标用户不存在");
        } finally {
          this.loading = false;
          this.visible = false;
        }
      }
    },
  },
};
</script>