<template>
  <v-app>
    <v-app-bar color="primary" dark app clipped-left>
      <v-app-bar-nav-icon
        @click="navigationDrawerOpen = !navigationDrawerOpen"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>ChaaAt</v-toolbar-title>
      <v-spacer></v-spacer>
      <ProfileMenu></ProfileMenu>
    </v-app-bar>

    <v-navigation-drawer v-model="navigationDrawerOpen" app clipped>
      <v-list class="py-0">
        <v-subheader>现有联系人</v-subheader>

        <v-list-group
          v-for="{ id, username, relationID, chatroom } of friendsAccepted"
          :key="id"
          @change="chatroomID = chatroom"
        >
          <template #activator>
            <v-list-item-title>{{ username }}</v-list-item-title>
          </template>
          <v-list-item>
            <v-list-item-title class="d-flex justify-space-around">
              <v-btn icon @click="destroyRelation(relationID)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list-group>

        <v-subheader v-if="friendsNotAccepted.length >= 1">
          待处理关系
        </v-subheader>

        <v-list-group
          v-for="{ id, username, asSender, relationID } of friendsNotAccepted"
          :key="id"
        >
          <template #activator>
            <v-list-item-title>
              {{ username }}
            </v-list-item-title>
          </template>
          <v-list-item>
            <v-list-item-title class="d-flex justify-space-around">
              <v-btn icon @click="destroyRelation(relationID)">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-btn v-if="!asSender" icon @click="acceptRelation(id)">
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list-group>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-title class="d-flex justify-space-around">
            <v-btn
              :loading="friendsLoading"
              :disabled="friendsLoading"
              icon
              @click="loadFriends"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>

            <FriendCreationBtn
              @success="loadFriends"
              @error="alert($event)"
            ></FriendCreationBtn>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <Chatroom v-if="chatroomID" :chatroomID="chatroomID"></Chatroom>
      <v-container v-else>
        <v-row class="mt-12 mb-3" justify="center">
          <v-icon size="100">mdi-alert-circle-outline</v-icon>
        </v-row>
        <v-row justify="center">
          <div class="text-h5 text--secondary">未选择会话</div>
        </v-row>
      </v-container>
    </v-main>

    <v-snackbar color="warning" v-model="snackbarOpen" app top right>
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script>
import { mapState } from "vuex";
import { friendRelations } from "../../apis";
import ProfileMenu from "../../components/ProfileMenu";
import Chatroom from "../../components/Chatroom";
import FriendCreationBtn from "../../components/FriendCreationBtn";

export default {
  components: { Chatroom, ProfileMenu, FriendCreationBtn },

  data: () => ({
    navigationDrawerOpen: undefined,
    friendsAccepted: [],
    friendsNotAccepted: [],
    friendsLoading: false,
    snackbarOpen: false,
    snackbarText: "",
    chatroomID: 0,
  }),

  computed: {
    ...mapState(["user"]),
  },

  methods: {
    /**
     *
     * @param {string} text
     */
    alert(text) {
      this.snackbarText = text;
      this.snackbarOpen = true;
    },
    async loadFriends() {
      this.friendsLoading = true;
      const relations = (await friendRelations.list()).results;
      this.friendsAccepted = [];
      this.friendsNotAccepted = [];
      for (const {
        id,
        sourceUser,
        targetUser,
        accepted,
        chatroom,
      } of relations) {
        const asSender = sourceUser.username == this.user.username;
        const user = asSender ? targetUser : sourceUser;
        (accepted ? this.friendsAccepted : this.friendsNotAccepted).push({
          relationID: id,
          ...user,
          asSender,
          chatroom,
        });
        this.$store.commit("appendUsers", { users: [user] });
      }
      this.friendsLoading = false;
    },
    /**
     *
     * @param {number} targetUserID
     */
    async acceptRelation(targetUserID) {
      await friendRelations.create(targetUserID);
      await this.loadFriends();
    },
    /**
     *
     * @param {number} id
     */
    async destroyRelation(id) {
      await friendRelations.destroy(id);
      await this.loadFriends();
    },
  },

  created() {
    this.loadFriends();
  },
};
</script>