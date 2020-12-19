<template>
  <v-list class="py-0">
    <v-subheader>好友</v-subheader>

    <v-list-group
      v-for="{ id, user, chatroom } of relations.accepted"
      :key="id"
      @change="$emit('change', chatroom)"
    >
      <template #activator>
        <v-list-item-title>{{ user.username }}</v-list-item-title>
      </template>
      <v-list-item>
        <v-list-item-title class="d-flex justify-space-around">
          <v-btn icon @click="destroy(id)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-list-item-title>
      </v-list-item>
    </v-list-group>

    <v-subheader v-if="relations.pending.length >= 1">待处理</v-subheader>

    <v-list-group v-for="{ id, user, asSender } of relations.pending" :key="id">
      <template #activator>
        <v-list-item-title>
          {{ user.username }}
        </v-list-item-title>
      </template>
      <v-list-item>
        <v-list-item-title class="d-flex justify-space-around">
          <v-btn icon @click="destroy(id)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-btn v-if="!asSender" icon @click="accept(user.id)">
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
  computed: {
    ...mapGetters("friendRelations", ["relations"]),
  },

  methods: {
    /**
     *
     * @param {number} targetUserID
     */
    accept(targetUserID) {
      apis.friendRelations.create(targetUserID);
    },
    /**
     *
     * @param {number} id
     */
    destroy(id) {
      apis.friendRelations.destroy(id);
    },
  },
};
</script>