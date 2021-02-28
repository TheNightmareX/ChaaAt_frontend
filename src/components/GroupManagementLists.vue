<template>
  <v-card height="600px">
    <v-list class="d-flex flex-column fill-height">
      <v-sheet>
        <v-tabs v-model="tab">
          <v-tab>好友分组</v-tab>

          <v-tab>群聊分组</v-tab>
        </v-tabs>
      </v-sheet>

      <v-sheet class="flex-grow-1" style="height: 0; overflow: auto">
        <v-fade-transition group :hide-on-leave="hideOnLeave">
          <GroupManagementListItem
            v-for="group of groups"
            :key="group.pk"
            :instance="group"
            :rules="rules"
            :rename="rename"
            :destroy="destroy"
            style="width: 100%"
          >
          </GroupManagementListItem>
        </v-fade-transition>
      </v-sheet>

      <v-sheet>
        <v-form ref="form" v-model="valid" @submit.prevent="create()">
          <v-list-item>
            <v-text-field
              v-model="inputGroupName"
              label="新建分组"
              hint="最多存在15个分组"
              counter="20"
              :disabled="groups.length >= QUOTA"
              :loading="inProgress"
              :rules="rules"
              @blur="form.resetValidation()"
            ></v-text-field>

            <v-list-item-action>
              <v-btn :disabled="inProgress || !valid" icon @click="create()">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-form>
      </v-sheet>
    </v-list>
  </v-card>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Ref, Vue, Watch } from "vue-property-decorator";
import { VForm } from "vuetify/components";
import GroupManagementListItem from "./GroupManagementListItem.vue";

enum Tab {
  FriendshipGroups,
  MembershipGroups,
}

@Component({
  components: { GroupManagementListItem },
})
export default class GroupManagementLists extends Vue {
  @Ref() form!: VForm;

  readonly QUOTA = 15;

  tab = Tab.FriendshipGroups;
  valid = true;
  inputGroupName = "";

  inProgress = false;

  hideOnLeave = false;

  get resourceHandlerClass() {
    return this.tab == Tab.FriendshipGroups
      ? models.FriendshipGroupResourceHandler
      : models.ChatroomMembershipGroupResourceHandler;
  }

  get resourceHandler() {
    return new this.resourceHandlerClass();
  }

  get rules() {
    const validations = this.resourceHandlerClass.objects.validations;
    return [validations.required, validations.maxLength, validations.unique];
  }

  get groups() {
    return this.resourceHandlerClass.objects.all;
  }

  @Watch("tab")
  async onTabUpdate() {
    this.hideOnLeave = true;
    await this.$nextTick();
    this.hideOnLeave = false;
  }

  async create() {
    if (this.inProgress || !this.valid) return;

    try {
      this.inProgress = true;
      await this.resourceHandler.create({ name: this.inputGroupName });
      this.inputGroupName = "";
      this.form.resetValidation();
    } catch {
      this.$notifier.error("创建失败");
    } finally {
      this.inProgress = false;
    }
  }

  async rename(instance: models.Group) {
    return await this.resourceHandler.partialUpdate(instance.pk, {
      name: instance.name,
    });
  }

  async destroy(instance: models.Group) {
    return await this.resourceHandler.destroy(instance.pk);
  }
}
</script>