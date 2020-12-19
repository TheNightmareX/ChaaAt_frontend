<template>
  <v-dialog v-model="visible" max-width="500">
    <template #activator="{ attrs, on }">
      <slot :on="on" :attrs="attrs"></slot>
    </template>
    <v-card>
      <v-card-title>好友申请</v-card-title>
      <v-card-text>
        <v-autocomplete
          :search-input.sync="searchInput"
          :items="users"
          :loading="loading"
          no-data-text="搜索无结果"
          cache-items
          autofocus
          label="用户搜索"
          @change="buildRelation"
        ></v-autocomplete>
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
    searchInput: "",
    users: [],
    loading: false,
  }),

  watch: {
    searchInput(v) {
      if (!v?.trim()) return;
      setTimeout(async () => {
        if (v != this.searchInput || this.loading) return;
        this.loading = true;
        this.users = (await apis.auth.list(v)).results.map(
          (user) => user.username
        );
        this.loading = false;
      }, 200);
    },
  },

  methods: {
    async buildRelation(username) {
      try {
        this.loading = true;
        const targetUser = (await apis.auth.retrieve(username)).id;
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
    },
  },
};
</script>