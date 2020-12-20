<template>
  <v-sheet>
    <slot v-bind="{ showMenu: show }"></slot>
    <v-menu :position-x="x" :position-y="y" absolute v-model="shown">
      <v-list dense min-width="200">
        <v-list-item @click="destroy">
          <v-list-item-title>删除好友</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-sheet>
</template>

<script>
import * as apis from "../apis";

/**@typedef {import("../apis/friend-relations").Relation} Relation */

export default {
  name: "FriendOperationMenu",

  data: () => ({
    /**@type {Relation} */
    relation: undefined,
    shown: false,
    x: 0,
    y: 0,
  }),

  props: {
    chatroomID: Number,
  },

  methods: {
    /**
     *
     * @param {MouseEvent} e
     * @param {Relation} relation
     */
    show(e, relation) {
      this.x = e.clientX;
      this.y = e.clientY;
      this.shown = true;
      this.relation = relation;
    },
    destroy() {
      apis.friendRelations.destroy(this.relation.id);
    },
  },
};
</script>

<style>
</style>