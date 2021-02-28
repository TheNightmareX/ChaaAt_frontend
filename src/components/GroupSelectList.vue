<template>
  <v-list dense>
    <v-list-item-group v-model="selected" multiple>
      <v-list-item v-for="item of items" :key="item.pk" :value="item">
        <template #default="{ active }">
          <v-list-item-action>
            <v-checkbox :value="active"></v-checkbox>
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>
              {{ item.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ item.itemCount }} 个成员
            </v-list-item-subtitle>
          </v-list-item-content>
        </template>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script lang="ts">
import * as models from "@/models";
import { Vue, Component, Prop, VModel, Watch } from "vue-property-decorator";

@Component
export default class GroupSelectList extends Vue {
  @VModel({ type: Array }) model!: models.Group[];

  @Prop({ type: Array, required: true }) items!: models.Group[];
  @Prop({ type: Function, required: true }) save!: () => Promise<void>;

  inited = false;
  timeoutHandler = 0;

  get selected() {
    return this.inited ? this.model : [];
  }

  set selected(v: models.Group[]) {
    this.model = v;
  }

  @Watch("model")
  onSelectedUpdate(to: models.Group[], from: models.Group[]) {
    // Update `itemCount` field of the group instance.
    if (to.length > from.length) {
      for (const item of to) {
        if (!from.includes(item)) {
          item.itemCount++;
          break;
        }
      }
    } else {
      for (const item of from) {
        if (!to.includes(item)) {
          item.itemCount--;
          break;
        }
      }
    }

    clearTimeout(this.timeoutHandler);
    this.timeoutHandler = setTimeout(this.save, 1000);
  }

  /**
   * Bypass the render bug.
   */
  async created() {
    await this.$nextTick();
    this.inited = true;
  }
}
</script>