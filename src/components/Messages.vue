<template>
  <v-sheet style="position: relative">
    <v-container ref="container" fluid style="height: 100%; overflow-y: scroll">
      <template v-for="item of computedItems">
        <v-row
          v-if="!item.continuously"
          :key="`time-${item.pk}`"
          class="text-caption text--secondary"
          justify="center"
        >
          {{ item.datetime }}
        </v-row>

        <v-row
          class="px-2"
          v-if="!item.sameSender || !item.continuously"
          :key="`name-${item.pk}`"
          :justify="item.justify"
        >
          {{ item.senderMembership.user.username }}
        </v-row>

        <v-row
          class="px-3 mb-0"
          :key="`text-${item.pk}`"
          :justify="item.justify"
        >
          <v-card
            class="pa-2"
            color="primary"
            dark
            v-intersect="
              ([entry]) => (item.intersecting = entry.isIntersecting)
            "
            style="white-space: pre-wrap"
            >{{ item.text }}</v-card
          >
        </v-row>
      </template>

      <v-row ref="bottom"></v-row>
    </v-container>

    <v-snackbar
      :value="!!unreadItems.length && !following"
      :timeout="-1"
      absolute
      color="info"
    >
      {{ unreadItems.length }} 条新消息

      <template #action="{ attrs }">
        <v-btn v-bind="attrs" icon @click="scrollToBottom()">
          <v-icon>mdi-chevron-double-down</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-sheet>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref, Watch } from "vue-property-decorator";
import * as models from "@/models";

export interface ComputedMessage extends models.Message {
  justify: string;
  datetime: string;
  sameSender: boolean;
  continuously: boolean;
  intersecting: boolean;
}

@Component
export default class Messages extends Vue {
  @Ref() container!: HTMLDivElement;
  @Ref() bottom!: HTMLDivElement;

  @Prop({ type: Array, required: true }) items!: models.Message[];
  @Prop({ type: Object, required: true }) chatroom!: models.Chatroom;
  @Prop({ type: Function, required: true }) markRead!: () => Promise<void>;

  intersections: Record<models.PK, boolean> = {};
  markReadTimeoutHandler = 0;

  get computedItems(): ComputedMessage[] {
    const intersections = this.intersections;
    return this.items.map((v, i) => ({
      ...v,
      justify:
        v.senderMembership.user.pk == this.$context.user.pk ? "end" : "start",
      datetime: v.creationTime.toLocaleString(undefined, { hour12: false }),
      sameSender:
        i != 0 &&
        v.senderMembership.pk == this.items[i - 1].senderMembership.pk,
      continuously:
        i != 0 &&
        v.creationTime.getTime() - this.items[i - 1].creationTime.getTime() <=
          1000 * 60 * 1,

      get read() {
        return v.read;
      },
      set read(value: boolean) {
        v.read = value;
      },

      get intersecting() {
        return intersections[this.pk];
      },
      set intersecting(value: boolean) {
        Vue.set(intersections, this.pk, value);
      },
    }));
  }

  get unreadItems() {
    return this.computedItems.filter((v) => !v.read);
  }
  get following() {
    return Object.values(this.intersections)
      .slice(-3)
      .some((v) => v);
  }

  @Watch("chatroom", { immediate: true })
  async onChatroomUpdate() {
    await this.$nextTick();
    this.scrollToBottom(true);
  }

  @Watch("items")
  onItemsUpdate() {
    if (this.following) this.scrollToBottom();
  }

  @Watch("unreadItems", { deep: true })
  onUnreadItemsUpdate(to: ComputedMessage[], from: ComputedMessage[]) {
    this.unreadItems
      .filter((v) => v.intersecting)
      .forEach((v) => (v.read = true));

    if (to.length < from.length) {
      clearTimeout(this.markReadTimeoutHandler);
      this.markReadTimeoutHandler = setTimeout(() => this.markRead(), 3000);
    }
  }

  scrollToBottom(instant = false) {
    this.$vuetify.goTo(this.bottom, {
      container: this.container,
      ...(instant ? { duration: 0 } : {}),
    });
  }

  async created() {
    this.items.filter((v) => !v.read).forEach((v) => (v.read = true));
    this.markRead();
  }
}
</script>