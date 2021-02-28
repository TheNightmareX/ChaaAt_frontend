<template>
  <v-list-item style="height: 70px">
    <v-list-item-content>
      <!-- common mode -->
      <v-sheet v-if="!renaming">
        <v-list-item-title>
          {{ instance.name }}
        </v-list-item-title>

        <v-list-item-subtitle>
          {{ instance.itemCount }} 个成员
        </v-list-item-subtitle>
      </v-sheet>

      <!-- rename mode -->
      <v-sheet v-else>
        <v-form ref="form" v-model="valid" @submit.prevent="performRename()">
          <v-text-field
            v-model="input"
            counter="20"
            autofocus
            :rules="allRules"
          ></v-text-field>
        </v-form>
      </v-sheet>
    </v-list-item-content>

    <v-list-item-action>
      <v-sheet v-if="!renaming">
        <!-- switch to rename mode -->
        <v-btn icon @click="renaming = true">
          <v-icon>mdi-rename-box</v-icon>
        </v-btn>

        <!-- delete -->
        <v-btn
          :loading="inProgress"
          :disabled="inProgress"
          icon
          @click="performDestroy()"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-sheet>

      <v-sheet v-else>
        <!-- submit rename -->
        <v-btn
          :loading="inProgress"
          :disabled="inProgress || !valid"
          icon
          @click="performRename()"
        >
          <v-icon>mdi-check</v-icon>
        </v-btn>

        <!-- cancel renaming -->
        <v-btn :disabled="inProgress" icon @click="renaming = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-sheet>
    </v-list-item-action>
  </v-list-item>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Prop, Ref, Vue, Watch } from "vue-property-decorator";
import { VForm } from "vuetify/components";

@Component
export default class GroupManagementListItem extends Vue {
  @Ref() form!: VForm;

  @Prop({ type: Object }) instance!: models.Group;

  @Prop({ type: Array, default: [] }) rules!: (() => true | string)[];
  @Prop({ type: Function, required: true }) rename!: (
    instance: models.Group
  ) => Promise<void>;
  @Prop({ type: Function, required: true }) destroy!: (
    instance: models.Group
  ) => Promise<void>;

  valid = true;
  renaming = false;
  input = "";
  inProgress = false;

  get allRules() {
    return [(v: string) => v != this.instance.name || "未修改", ...this.rules];
  }

  @Watch("renaming")
  onRenamingUpdate() {
    this.input = this.instance.name;
  }

  async perform(
    action: (instance: models.Group) => Promise<void>,
    errorMsg: string
  ) {
    try {
      this.inProgress = true;
      await action({ ...this.instance, name: this.input });
      this.renaming = false;
    } catch {
      this.$notifier.error(errorMsg);
    } finally {
      this.inProgress = false;
    }
  }

  async performRename() {
    this.perform(this.rename, "重命名失败");
  }

  async performDestroy() {
    this.perform(this.destroy, "删除失败");
  }
}
</script>