<template>
  <v-snackbar
    v-model="show"
    :color="color"
    app
    :right="!$context.isMobile"
    top
    :multi-line="$context.isMobile"
  >
    <v-icon v-if="!!icon">{{ icon }}</v-icon>

    {{ text }}

    <template #action>
      <v-btn icon @click="show = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

type Color =
  | "primary"
  | "secondary"
  | "accent"
  | "info"
  | "warning"
  | "error"
  | "success"
  | "anchor";

@Component
export default class Notifier extends Vue {
  color: Color = "info";
  text = "";
  icon: string | null = null;
  show = false;

  async notify(message: string, color: Color = "info", icon?: string) {
    this.text = message;
    this.color = color;
    this.icon = icon ?? null;

    this.show = false;
    await this.$nextTick();
    this.show = true;
  }

  async info(message: string) {
    await this.notify(message, "info", "mdi-infomation");
  }

  async warn(message: string) {
    await this.notify(message, "info", "mdi-alert");
  }

  async error(message: string) {
    await this.notify(message, "error", "mdi-alert");
  }
}
</script>