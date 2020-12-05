<template>
  <v-sheet class="d-flex flex-column fill-height">
    <v-sheet
      ref="msgs-container"
      class="flex-grow-1"
      style="height: 0; overflow: auto"
    >
      <v-container fluid>
        <v-sheet
          class="mb-2 px-2"
          v-for="{
            id,
            text,
            sender,
            gap,
            creationTime,
            differentSender,
          } of messages"
          :key="id"
        >
          <v-row
            v-if="gap"
            class="text-caption text--secondary"
            justify="center"
          >
            {{ creationTime }}
          </v-row>
          <v-row
            v-if="differentSender || gap"
            :justify="sender == user.id ? 'end' : 'start'"
          >
            {{ users[sender].username }}
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
    <v-sheet>
      <v-toolbar color="primary" dense flat></v-toolbar>
      <v-form ref="form">
        <v-textarea
          v-model="msgInput"
          no-resize
          filled
          autofocus
          clearable
          full-width
          counter="100"
          append-icon="mdi-send"
          :rules="[
            (v) => (v && /^\s*$/.test(v) ? '消息不得为空字符' : true),
            (v) => !v || v.length <= 100 || '至多100字',
          ]"
          hint="按下 Ctrl + Enter 发送"
          @click:append="send"
          @keydown.enter.ctrl="send"
        ></v-textarea>
      </v-form>
    </v-sheet>
  </v-sheet>
</template>

<script>
import "vuetify";
import { mapState } from "vuex";
import { messages } from "../apis";

/**@typedef {import('../apis/messages').Message} Message */

export default {
  name: "Chatroom",

  data() {
    return {
      msgInput: "",
    };
  },

  props: {
    chatroomID: Number,
  },

  computed: {
    ...mapState({
      user: "user",
      users: "users",
      messagesMap: "messages",
    }),
    /**
     * Filter the messages to get the ones which are relevant
     * to the current chatroom and compute some extra values.
     */
    messages() {
      /**@type {Message[]} */
      const all = Object.values(this.messagesMap);
      /**@type {Message[]} */
      const filtered = all.filter((v) => v.chatroom == this.chatroomID);
      const computed = filtered.map((v, i) => {
        const INTERVAL = 60000 * 1;
        const previous = filtered[i - 1];
        const creation = new Date(v.creationTime);
        return {
          ...v,
          creationTime: creation.toLocaleString(undefined, { hour12: false }),
          gap: !previous || creation - new Date(previous.creationTime) > INTERVAL,
          differentSender: !previous || v.sender != previous.sender,
        };
      });
      return computed;
    },
  },

  watch: {
    messages() {
      this.scrollToBottom();
    },
  },

  methods: {
    /**
     * Create a message, and the syncer will update messages automatically.
     */
    send() {
      if (!this.msgInput || !this.$refs.form.validate()) return;
      messages.create({ text: this.msgInput, chatroom: this.chatroomID });
      this.msgInput = "";
    },
    scrollToBottom() {
      const el = this.$refs["msgs-container"];
      this.$vuetify.goTo(9999, { container: el });
    },
  },
  mounted() {
    this.scrollToBottom();
  },
};
</script>