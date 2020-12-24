<template>
  <v-list class="py-0 d-flex flex-column fill-height">
    <v-sheet class="flex-grow-1" style="height: 0; overflow: auto">
      <v-menu
        :position-x="menuX"
        :position-y="menuY"
        absolute
        v-model="menuShown"
      >
        <v-list v-if="menuShown" dense min-width="200">
          <v-list-item
            @click="
              (fixedMapping[menuOnRelation.chatroom] ? $delete : $set)(
                fixedMapping,
                menuOnRelation.chatroom,
                true
              )
            "
          >
            <v-list-item-title>{{
              fixedMapping[menuOnRelation.chatroom] ? "取消固定" : "固定顶部"
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="destroy(menuOnRelation)">
            <v-list-item-title>删除好友</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-subheader>好友</v-subheader>
      <v-list-item-group>
        <transition-group>
          <v-list-item
            two-line
            v-for="relation of sortedAcceptedRelations"
            :key="relation.id"
            @click="$emit('change', relation.chatroom)"
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

      <v-subheader v-if="relations.pending.length >= 1">待处理</v-subheader>

      <v-list-group v-for="relation of relations.pending" :key="relation.id">
        <template #activator>
          <v-list-item-title>
            {{ relation.user.username }}
          </v-list-item-title>
        </template>
        <v-list-item>
          <v-list-item-title class="d-flex justify-space-around">
            <v-btn icon @click="destroy(relation)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-btn v-if="!relation.asSender" icon @click="accept(relation)">
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </v-list-item-title>
        </v-list-item>
      </v-list-group>
    </v-sheet>

    <v-sheet>
      <v-divider></v-divider>
      <slot></slot>
    </v-sheet>
  </v-list>
</template>

<script>
import * as timeago from "timeago.js";
import * as apis from "../apis";
import { mapGetters } from "vuex";

/**@typedef {import("../store").ComputedMessage} Message */
/**@typedef {import("../store").ComputedFriendRelation} Relation */

export default {
  name: "FriendsList",

  data: () => ({
    menuShown: false,
    menuX: 0,
    menuY: 0,
    menuOnRelation: undefined,
    tick: false,
    tickHandler: undefined,
    fixedMapping: {},
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
    showMenu(e, relation) {
      this.menuShown = false;
      this.menuX = e.clientX;
      this.menuY = e.clientY;
      this.$nextTick(() => (this.menuShown = true));
      this.menuOnRelation = relation;
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