<template>
  <v-list class="py-0 fill-height d-flex flex-column">
    <v-menu
      v-model="menu.show"
      absolute
      min-width="200"
      max-width="200"
      :close-on-content-click="false"
      :position-x="menu.position.x"
      :position-y="menu.position.y"
    >
      <slot
        v-if="!!menu.on"
        name="menu"
        :item="menu.on"
        :close="() => (menu.show = false)"
      ></slot>
    </v-menu>

    <v-sheet class="flex-grow-1" style="height: 0">
      <slot name="prepend"></slot>

      <v-list-item-group
        v-model="chatroom"
        @change="$emit('change', $event ? getItem($event) : $event)"
      >
        <v-fade-transition group>
          <v-list-item
            v-for="item of sortedItems"
            :key="item.proto.pk"
            :value="item.chatroom"
            @contextmenu.prevent="showMenu($event, item)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>

              <v-list-item-subtitle>
                {{ item.latestMessage.text }}
              </v-list-item-subtitle>

              <v-list-item-subtitle>
                {{ item.latestMessage.timeAgo }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-fade-transition>
      </v-list-item-group>
    </v-sheet>

    <v-sheet v-if="!!groups">
      <v-divider></v-divider>

      <v-list-item>
        <v-list-item-title>
          <v-select
            v-model="selectedGroups"
            label="分组"
            no-data-text="当前无分组"
            multiple
            chips
            hide-details
            deletable-chips
            :items="groupSelections"
          ></v-select>
        </v-list-item-title>

        <v-list-item-action>
          <component
            :is="$context.isMobile ? 'VDialog' : 'VMenu'"
            min-width="300"
            max-width="300"
            :close-on-content-click="false"
          >
            <template #activator="{ attrs, on }">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
            </template>
            <GroupManagementLists></GroupManagementLists>
          </component>
        </v-list-item-action>
      </v-list-item>
    </v-sheet>
  </v-list>
</template>

<script lang="ts">
import { TickMixin } from "@/mixins";
import * as models from "@/models";
import * as timeago from "timeago.js";
import { Component, Mixins, Prop, VModel } from "vue-property-decorator";
import { VDialog, VMenu } from "vuetify/lib";
import GroupManagementLists from "./GroupManagementLists.vue";

export interface Contact {
  title: string;
  chatroom: models.Chatroom;
  proto: models.Model;
}

export interface ComputedContact extends Contact {
  latestMessage: {
    instance: models.Message | null;
    text: string;
    timeAgo: string;
  };
}

@Component({
  components: { GroupManagementLists, VMenu, VDialog },
})
export default class ContactList extends Mixins(TickMixin) {
  @VModel({ type: Object }) chatroom!: models.Chatroom | null;

  @Prop({ type: Array, required: true }) items!: Contact[];
  @Prop({ type: Array }) groups?: models.Group[];
  @Prop({ type: Function }) sorter!: (
    a: ComputedContact,
    b: ComputedContact
  ) => number;

  menu: {
    position: { x: number; y: number };
    show: boolean;
    on?: Contact;
  } = { position: { x: 0, y: 0 }, show: false, on: undefined };

  selectedGroups: models.Group[] = [];

  get groupSelections() {
    return this.groups?.map((v) => ({
      text: `${v.name} (${v.itemCount})`,
      value: v,
    }));
  }

  get filteredItems() {
    return this.selectedGroups.length
      ? this.items.filter((v) =>
          (v.proto as models.Model & {
            groups: models.Group[];
          }).groups.some((v) => this.selectedGroups.includes(v))
        )
      : this.items;
  }

  get computedItems(): ComputedContact[] {
    this.tick;

    return this.filteredItems.map((v) => {
      const latestMessage = models.MessageResourceHandler.objects.latest(
        v.chatroom
      );
      return {
        ...v,
        latestMessage: {
          instance: latestMessage,
          text: latestMessage?.text ?? "...",
          timeAgo: latestMessage
            ? timeago.format(latestMessage.creationTime, "zh_CN")
            : "...",
        },
      };
    });
  }

  get sortedItems() {
    if (this.sorter) return this.computedItems.sort(this.sorter);
    else return this.computedItems;
  }

  async showMenu(ev: MouseEvent, item: Contact) {
    this.menu.on = item;

    this.menu.show = false;

    this.menu.position.x = ev.clientX;
    this.menu.position.y = ev.clientY;

    await this.$nextTick();
    this.menu.show = true;
  }

  getItem(chatroom: models.Chatroom) {
    const ret = this.computedItems.find((v) => v.chatroom.pk == chatroom.pk);
    return ret as NonNullable<typeof ret>;
  }
}
</script>