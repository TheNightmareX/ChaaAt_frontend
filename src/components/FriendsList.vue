<template>
  <v-list class="py-0 d-flex flex-column fill-height">
    <v-sheet class="flex-grow-1" style="height: 0; overflow: auto">
      <!-- accepted friends -->
      <v-list-group :value="true" prepend-icon="mdi-account-multiple">
        <ContextMenu ref="menu">
          <template v-slot="{ shown }">
            <v-list v-if="shown" dense min-width="200">
              <v-list-item
                @click="
                  (fixedMapping[relationMenuOn.chatroom] ? $delete : $set)(
                    fixedMapping,
                    relationMenuOn.chatroom,
                    true
                  )
                "
              >
                <v-list-item-title>{{
                  fixedMapping[relationMenuOn.chatroom]
                    ? "取消固定"
                    : "固定顶部"
                }}</v-list-item-title>
              </v-list-item>

              <v-list-item @click="destroy(relationMenuOn)">
                <v-list-item-title>删除好友</v-list-item-title>
              </v-list-item>
            </v-list>
          </template>
        </ContextMenu>

        <template #activator>
          <v-list-item-title>好友</v-list-item-title>
        </template>

        <v-list-item-group>
          <transition-group>
            <v-list-item
              v-for="relation of sortedAcceptedRelations"
              :key="relation.id"
              two-line
              @click="switchChatroom({ chatroomID: relation.chatroom })"
              @contextmenu.prevent="showMenu($event, relation)"
            >
              <v-list-item-content>
                <v-list-item-title
                  :class="
                    fixedMapping[relation.chatroom] ? 'secondary--text' : ''
                  "
                  >{{ relation.user.username }}</v-list-item-title
                >
                <v-list-item-subtitle
                  v-for="[i, content] in latestMessageDisplayMapping[
                    relation.id
                  ].entries()"
                  :key="i"
                  >{{ content }}</v-list-item-subtitle
                >
              </v-list-item-content>
            </v-list-item>
          </transition-group>
        </v-list-item-group>
      </v-list-group>

      <!-- pending requests -->
      <v-list-group
        v-if="relations.pending.length"
        prepend-icon="mdi-account-multiple-plus"
      >
        <template #activator>
          <v-list-item-title>申请</v-list-item-title>
        </template>

        <v-sheet v-for="relation of relations.pending" :key="relation.id">
          <v-menu absolute>
            <template #activator="{ attrs, on }">
              <v-list-item v-bind="attrs" v-on="on">
                <v-list-item-icon>
                  <v-icon>{{
                    relation.asSender
                      ? "mdi-arrow-right-bold"
                      : "mdi-arrow-left-bold"
                  }}</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>{{
                    relation.user.username
                  }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>

            <v-list dense min-width="200">
              <v-list-item v-if="!relation.asSender" @click="accept(relation)">
                <v-list-item-title>接受申请</v-list-item-title>
              </v-list-item>
              <v-list-item @click="destroy(relation)">
                <v-list-item-title>{{
                  relation.asSender ? "取消申请" : "拒绝申请"
                }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-sheet>
      </v-list-group>
    </v-sheet>

    <!-- bottom actions -->
    <v-sheet>
      <v-divider></v-divider>
      <slot></slot>
    </v-sheet>
  </v-list>
</template>

<script>
import * as timeago from "timeago.js";
import * as apis from "../apis";
import { mapGetters, mapMutations } from "vuex";
import ContextMenu from "./ContextMenu";

/**@typedef {import("../store").ComputedMessage} Message */
/**@typedef {import("../store").ComputedFriendRelation} Relation */

export default {
  name: "FriendsList",

  components: { ContextMenu },

  data: () => ({
    tick: false,
    tickHandler: undefined,
    fixedMapping: {},
    relationMenuOn: undefined,
  }),

  computed: {
    ...mapGetters("friendRelations", ["relations"]),
    ...mapGetters("messages", ["messagesMapping"]),
    /**@returns {Object<number, [string, string]>} */
    latestMessageDisplayMapping() {
      this.tick;

      const mapping = {};
      /**@type {Relation[]} */
      const relations = this.relations.accepted;
      relations.forEach((relation) => {
        /**@type {Message} */
        const message = this.messagesMapping[relation.chatroom]?.slice(-1)?.[0];
        mapping[relation.id] = message
          ? [message.text, timeago.format(message.creationTime, "zh_CN")]
          : ["...", "..."];
      });

      return mapping;
    },
    sortedAcceptedRelations() {
      /**@type {Relation[]} */
      const relations = this.relations.accepted;
      /**@type {Object<number, Message[]>} */
      const messagesMapping = this.messagesMapping;

      return relations.sort((rA, rB) => {
        const [timeA, timeB] = [rA, rB].map((r) =>
          this.fixedMapping[r.chatroom]
            ? new Date()
            : messagesMapping[r.chatroom]?.slice(-1)?.[0]?.creationTime ??
              new Date(0)
        );
        return timeB - timeA;
      });
    },
  },

  methods: {
    ...mapMutations(['switchChatroom']),
    showMenu(e, relation) {
      this.relationMenuOn = relation;
      this.$refs.menu.show(e);
    },
    accept(relation) {
      apis.friendRelations.create({ targetUser: relation.user.id });
    },
    destroy(relation) {
      apis.friendRelations.destroy({ id: relation.id });
    },
  },

  created() {
    this.tickHandler = setInterval(() => {
      this.tick = !this.tick;
    }, 1000);
  },

  destroyed() {
    clearInterval(this.tickHandler);
  },
};
</script>

<style scoped>
.v-move {
  transition: all 0.2s;
}
</style>