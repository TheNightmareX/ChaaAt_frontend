<template>
  <v-sheet>
    <v-toolbar outlined flat dense>
      <v-btn icon>
        <v-icon>mdi-image</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-file</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-folder</v-icon>
      </v-btn>
    </v-toolbar>

    <v-sheet
      class="px-3 pb-2 d-flex align-center"
      :class="{ 'pt-2': $context.isMobile }"
      :color="$context.isMobile ? 'primary' : undefined"
      style="position: relative"
    >
      <v-form class="flex-grow-1" ref="form" v-model="valid">
        <v-textarea
          v-model="text"
          no-resize
          hint="按下 Ctrl + Enter 以发送"
          :rules="rules"
          :loading="inProgress"
          :counter="maxLength"
          :rows="$context.isMobile ? 1 : 5"
          :single-line="$context.isMobile"
          :hide-details="$context.isMobile"
          :solo="$context.isMobile"
          @keydown.ctrl.enter="performSend()"
          @blur="form.resetValidation()"
        ></v-textarea>
      </v-form>

      <v-btn
        :class="$context.isMobile ? ['ml-2'] : undefined"
        :absolute="!$context.isMobile"
        :right="!$context.isMobile"
        :color="$context.isMobile ? undefined : 'primary'"
        :disabled="!sendable"
        :style="$context.isMobile ? undefined : { bottom: '42px' }"
        @click="performSend()"
      >
        发送
      </v-btn>
    </v-sheet>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from "vue-property-decorator";
import { VForm } from "vuetify/components";

@Component
export default class MessageInput extends Vue {
  @Ref() form!: VForm;

  @Prop({ type: Number, required: true }) maxLength!: number;
  @Prop({ type: Function, required: true }) send!: (
    text: string
  ) => Promise<void>;

  text = "";
  valid = true;
  inProgress = false;

  get rules() {
    return [
      (v: string) => !!v || "不得为空",
      (v: string) =>
        v.length <= this.maxLength || `不得超过 ${this.maxLength} 个字符`,
    ];
  }

  get sendable() {
    return this.valid && !this.inProgress;
  }

  async performSend() {
    if (!this.sendable) return;

    try {
      this.inProgress = true;
      await this.send(this.text);
      this.text = "";
      this.form.resetValidation()
    } finally {
      this.inProgress = false;
    }
  }
}
</script>