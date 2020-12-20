<template>
  <FriendOperationMenu>
    <template v-slot="{ showMenu }">
      <v-list class="py-0">
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

        <v-list-group
          v-for="{ id, user, asSender } of relations.pending"
          :key="id"
        >
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
  </FriendOperationMenu>
</template>

<script>
import * as apis from "../apis";
import { mapGetters } from "vuex";
import FriendOperationMenu from "./FriendOperationMenu";

export default {
  name: "FriendList",

  components: { FriendOperationMenu },

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
  },
};
</script>