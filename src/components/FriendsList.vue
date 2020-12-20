<template>
  <v-list class="py-0">
    <v-menu
      :position-x="menuX"
      :position-y="menuY"
      absolute
      v-model="menuShown"
    >
      <v-list dense min-width="200">
        <v-list-item @click="destroy(menuOnRelation)">
          <v-list-item-title>删除好友</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-subheader>好友</v-subheader>

    <v-list-item-group>
      <v-list-item
        v-for="relation of relations.accepted"
        :key="relation.id"
        @click="$emit('change', relation.chatroom)"
        @contextmenu.prevent="showMenu($event, relation)"
      >
        <v-list-item-title>{{ relation.user.username }}</v-list-item-title>
      </v-list-item>
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

    <v-divider></v-divider>

    <slot name="bottom"></slot>
  </v-list>
</template>

<script>
import * as apis from "../apis";
import { mapGetters } from "vuex";

export default {
  name: "FriendsList",

  data: () => ({
    menuShown: false,
    menuX: 0,
    menuY: 0,
    menuOnRelation: undefined,
  }),

  computed: {
    ...mapGetters("friendRelations", ["relations"]),
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
      apis.friendRelations.create(relation.user.id);
    },
    destroy(relation) {
      apis.friendRelations.destroy(relation.id);
    },
  },
};
</script>