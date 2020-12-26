<template>
  <v-sheet class="d-flex flex-column fill-height">
    <v-sheet
      ref="msgs-scroller"
      class="flex-grow-1"
      style="height: 0; overflow: auto"
    >
      <v-container fluid>
        <v-row
          v-intersect="(entries) => (topExposed = entries[0].isIntersecting)"
          style="height: 1px"
        ></v-row>

        <v-sheet
          class="mb-2 px-2"
          v-for="{
            id,
            text,
            sender,
            hasTimeGap,
            creationTime,
            isDifferentSender,
          } of renderedMessages"
          :key="id"
          v-intersect="
            (entries) =>
              $set(messageVisibilityMapping, id, entries[0].isIntersecting)
          "
        >
          <v-row
            v-if="hasTimeGap"
            class="text-caption text--secondary"
            justify="center"
          >
            {{ creationTime.toLocaleString(undefined, { hour12: false }) }}
          </v-row>
          <v-row
            v-if="isDifferentSender || hasTimeGap"
            :justify="sender == user.id ? 'end' : 'start'"
          >
            {{ (users[sender] || { username: "[未知用户]" }).username }}
          </v-row>
          <v-row :justify="sender == user.id ? 'end' : 'start'">
            <v-card
              class="pa-2"
              color="primary"
              dark
              style="white-space: pre-wrap"
              >{{ text }}</v-card
            >
          </v-row>
        </v-sheet>
      </v-container>
    </v-sheet>

    <v-sheet style="position: relative">
      <v-snackbar :value="messageUpdates" color="info" timeout="-1" absolute>
        {{ messageUpdates }}条新消息
        <template #action>
          <v-btn icon @click="scrollToBottom">
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </v-sheet>

    <v-form ref="form">
      <v-sheet v-if="$vuetify.breakpoint.smAndUp">
        <v-toolbar color="primary" dense flat></v-toolbar>
        <v-textarea
          v-model="textInput"
          no-resize
          filled
          autofocus
          clearable
          full-width
          counter="100"
          append-icon="mdi-send"
          :rules="[
            (v) => !v || !!v.trim() || '消息不得为空',
            (v) => !v || v.length <= 100 || '至多100字',
          ]"
          hint="按下 Ctrl + Enter 发送"
          @click:append="send"
          @keydown.enter.ctrl="send"
        ></v-textarea>
      </v-sheet>
      <v-sheet v-else color="primary" style="overflow: hidden">
        <v-container>
          <v-row no-gutters>
            <v-col class="py-0">
              <v-textarea
                v-model="textInput"
                no-resize
                rows="1"
                :auto-grow="autoGrow"
                solo
                dense
                style="margin-bottom: -28px"
                append-icon="mdi-send"
                :rules="[(v) => !v || (!!v.trim() && v.length <= 100)]"
                @click:append="send"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </v-form>
  </v-sheet>
</template>

<script>
import "vuetify";
import { mapGetters, mapState } from "vuex";
import * as apis from "../apis";

/**@typedef {import('../store').ComputedMessage} Message */

export default {
  name: "Chatroom",

  data: () => ({
    textInput: "",
    topExposed: false,
    renderMessageFrom: 0,
    /**@type {Object<number, boolean>} */
    messageVisibilityMapping: {},
    messageUpdates: 0,
  }),

  computed: {
    ...mapState(["user"]),
    ...mapState({ chatroomID: "activeChatroomID" }),
    ...mapGetters(["users"]),
    ...mapGetters("messages", ["messagesMapping"]),
    /**@returns {Message[]} */
    relatedMessages() {
      return this.messagesMapping[this.chatroomID] ?? [];
    },
    /**@returns {Message[]} */
    renderedMessages() {
      return this.relatedMessages.slice(this.renderMessageFrom);
    },
    /**@returns {boolean} */
    autoGrow() {
      return this.textInput.split("\n").length < 4;
    },
    /**
     * Whether the user is focusing on new messages.
     */
    userFocusing() {
      return !!Object.values(this.messageVisibilityMapping).slice(-3)[0];
    },
  },

  watch: {
    chatroomID() {
      this.init();
    },
    /**
     * Scroll to the bottom if user sent a message or is focusing on the new messages.
     * Record the message updates which the user didn't noticed.
     * @param {Message[]} newV
     * @param {Message[]} oldV
     */
    relatedMessages(newV, oldV) {
      // No operation when it is triggered because of the `chatroomID`'s change
      if (newV.length <= oldV.length || newV[0].id != oldV[0]?.id) return;

      const differences = newV.slice(oldV.length);
      const sent = differences.some((msg) => msg.sender == this.user.id);
      const received = differences.filter((msg) => msg.sender != this.user.id)
        .length;

      if (this.userFocusing || sent) {
        this.scrollToBottom();
      } else {
        this.messageUpdates += received;
      }
    },
    /**
     * Load more messages when the user scrolls to the top.
     */
    async topExposed(exposed) {
      if (!exposed) return;

      while (this.topExposed && this.renderMessageFrom > 0) {
        this.renderMessageFrom--;
        await new Promise((r) => setTimeout(r, 50));
      }
    },
    /**
     * Clear the message updates.
     */
    userFocusing() {
      if (this.userFocusing) this.messageUpdates = 0;
    },
  },

  methods: {
    init() {
      const INIT_SIZE = 20;
      const length = this.relatedMessages.length;
      this.renderMessageFrom = length > INIT_SIZE ? length - INIT_SIZE : 0;
      this.scrollToBottom();
    },
    /**
     * Create a message, and the syncer will update messages automatically.
     */
    send() {
      if (!this.textInput || !this.$refs["form"].validate()) return;
      apis.messages.create({
        message: { text: this.textInput, chatroom: this.chatroomID },
      });
      this.textInput = "";
    },
    scrollToBottom() {
      const el = this.$refs["msgs-scroller"];
      this.$vuetify.goTo(9999, { container: el });
    },
  },
  mounted() {
    this.init();
  },
};
</script>