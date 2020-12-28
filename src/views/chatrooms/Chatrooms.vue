<template>
  <v-app>
    <v-app-bar color="primary" dark app clipped-left>
      <v-app-bar-nav-icon
        @click="navigationDrawerOpen = !navigationDrawerOpen"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>ChaaAt</v-toolbar-title>
      <v-spacer></v-spacer>
      <ProfileMenu offset-y transition="scale-transition" origin="top right">
        <template v-slot="{ attrs, on }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>
      </ProfileMenu>
    </v-app-bar>

    <v-navigation-drawer v-model="navigationDrawerOpen" app clipped>
      <FriendsList>
        <v-list-item>
          <v-list-item-title class="d-flex justify-space-around">
            <RelationCreationDialog @error="alert($event)">
              <template v-slot="{ attrs, on }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
            </RelationCreationDialog>
          </v-list-item-title>
        </v-list-item>
      </FriendsList>
    </v-navigation-drawer>

    <v-main>
      <Chatroom
        v-if="
          friendRelations.accepted.some(
            (v) => v.chatroom == this.activeChatroomID
          )
        "
      ></Chatroom>
      <v-container v-else>
        <v-row class="mt-12 mb-3" justify="center">
          <v-icon size="100">mdi-alert-circle-outline</v-icon>
        </v-row>
        <v-row justify="center">
          <div class="text-h5 text--secondary">未选择会话</div>
        </v-row>
      </v-container>
    </v-main>

    <Notifier app top right ref="notifier"></Notifier>
  </v-app>
</template>

<script>
import axios from "axios";
import { mapState, mapGetters, mapActions } from "vuex";
import * as apis from "../../apis";

import ProfileMenu from "../../components/ProfileMenu";
import Chatroom from "../../components/Chatroom";
import RelationCreationDialog from "../../components/RelationCreationDialog";
import Notifier from "../../components/Notifier";
import FriendsList from "../../components/FriendsList";

export default {
  components: {
    Chatroom,
    ProfileMenu,
    RelationCreationDialog,
    Notifier,
    FriendsList,
  },

  data: () => ({
    navigationDrawerOpen: undefined,
    syncersRunning: false,
    syncersKiller: undefined,
  }),

  computed: {
    ...mapState(["user", "activeChatroomID"]),
    ...mapGetters("friendRelations", {
      friendRelations: "relations",
    }),
  },

  watch: {
    /**
     * true: set up the syncers
     * false: stop the syncers after handling the pending request
     */
    syncersRunning(v) {
      if (v) {
        const source = axios.CancelToken.source();
        this.syncersKiller = source.cancel;
        (async () => {
          console.log(`syncer is running`);
          while (this.syncersRunning) {
            try {
              await this.sync({ cancelToken: source.token });
            } catch (e) {
              if (e.constructor == axios.Cancel) break;
              else {
                console.warn(`Caught error in syncer\n`, e);
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }
          console.log(`syncer is stoped`);
        })();
      }
    },
  },

  methods: {
    ...mapActions(["sync"]),
    ...mapActions("friendRelations", { loadFriendRelations: "load" }),
    ...mapActions("messages", { loadMessages: "load" }),
    /**
     *
     * @param {string} msg
     */
    alert(msg) {
      this.$refs["notifier"].notify(msg, "warning");
    },
  },

  async created() {
    await apis.updates.clear();
    this.syncersRunning = true;
    this.loadMessages()
    this.loadFriendRelations()
  },

  destroyed() {
    this.syncersRunning = false;
    this.syncersKiller();
  },
};
</script>