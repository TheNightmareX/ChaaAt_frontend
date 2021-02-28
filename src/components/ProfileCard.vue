<template>
  <v-card>
    <v-card-title class="headline" :class="[titleColorClass]">
      {{ user.username }}
    </v-card-title>

    <v-card-text>{{ user.bio }}</v-card-text>

    <v-divider v-if="!!$slots['actions']"></v-divider>

    <v-card-actions class="pa-0">
      <slot name="actions"></slot>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import * as models from "@/models";

@Component
export default class ProfileCard extends Vue {
  @Prop({ type: Object, required: true }) user!: models.User;

  get icon() {
    return {
      [models.SexOption.Male]: "mdi-human-male",
      [models.SexOption.Female]: "mdi-human-female",
      [models.SexOption.Unknow]: "mdi-alien",
    }[this.user.sex];
  }

  get titleColorClass() {
    return {
      [models.SexOption.Male]: "indigo--text",
      [models.SexOption.Female]: "purple--text",
      [models.SexOption.Unknow]: "green--text",
    }[this.user.sex];
  }
}
</script>