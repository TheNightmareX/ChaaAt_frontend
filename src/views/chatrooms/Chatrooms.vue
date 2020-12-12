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
          v-for="{ id, user, chatroom } of friendRelations.accepted"
          :key="id"
          @change="chatroomID = chatroom"
        >
          <template #activator>
            <v-list-item-title>{{ user.username }}</v-list-item-title>
          </template>
          <v-list-item>
            <v-list-item-title class="d-flex justify-space-around">
              <v-btn icon @click="destroyRelation(id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list-group>

        <v-subheader v-if="friendRelations.pending.length >= 1">
          待处理关系
        </v-subheader>

        <v-list-group
          v-for="{ id, user, asSender } of friendRelations.pending"
          :key="id"
        >
          <template #activator>
            <v-list-item-title>
              {{ user.username }}
            </v-list-item-title>
          </template>
          <v-list-item>
            <v-list-item-title class="d-flex justify-space-around">
              <v-btn icon @click="destroyRelation(id)">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-btn v-if="!asSender" icon @click="acceptRelation(user.id)">
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list-group>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-title class="d-flex justify-space-around">
            <FriendCreationBtn @error="alert($event)"></FriendCreationBtn>
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
import axios from "axios";
import { mapState, mapGetters } from "vuex";
import { friendRelations } from "../../apis";
import ProfileMenu from "../../components/ProfileMenu";
import Chatroom from "../../components/Chatroom";
import FriendCreationBtn from "../../components/FriendCreationBtn";

export default {
  components: { Chatroom, ProfileMenu, FriendCreationBtn },

  data: () => ({
    navigationDrawerOpen: undefined,
    snackbarOpen: false,
    snackbarText: "",
    chatroomID: 0,
    syncersRunning: false,
    destroySyncers: undefined,
  }),

  computed: {
    ...mapState(["user"]),
    ...mapGetters(["friendRelations"]),
  },

  watch: {
    /**
     * Close the chatroom if the relation is destroyed.
     */
    friendRelations({ accepted }) {
      if (!accepted.some((v) => v.chatroom == this.chatroomID)) {
        this.chatroomID = 0;
      }
    },
    /**
     * true: set up the syncers
     * false: stop the syncers after handling the pending request
     */
    syncersRunning(v) {
      if (v) {
        const source = axios.CancelToken.source();
        this.destroySyncers = source.cancel;
        (async () => {
          try {
            console.log("messages syncer is running");
            while (this.syncersRunning) {
              await this.$store.dispatch("syncMessages", {
                cancelToken: source.token,
              });
            }
          } catch {
            null;
          } finally {
            console.log("messages syncer is stoped");
          }
        })();
        (async () => {
          try {
            console.log("friend relations syncer is running");
            while (this.syncersRunning) {
              await this.$store.dispatch("syncFriendRelations", {
                cancelToken: source.token,
              });
            }
          } catch {
            null;
          } finally {
            console.log("friend relations syncer is stoped");
          }
        })();
      }
    },
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
    /**
     *
     * @param {number} targetUserID
     */
    async acceptRelation(targetUserID) {
      await friendRelations.create(targetUserID);
    },
    /**
     *
     * @param {number} id
     */
    async destroyRelation(id) {
      await friendRelations.destroy(id);
    },
  },

  created() {
    this.syncersRunning = true;
  },

  destroyed() {
    this.syncersRunning = false;
    this.destroySyncers();
  },
};
</script>