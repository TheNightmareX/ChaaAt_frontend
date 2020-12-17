<template>
  <v-sheet class="d-flex flex-column fill-height">
    <v-sheet
      ref="msgs-container"
      class="flex-grow-1"
      style="height: 0; overflow: auto"
    >
      <v-container fluid>
        <v-row
          v-intersect="(entries) => (topExposed = entries[0].isIntersecting)"
          style="height: 1px"
        >
        </v-row>
        <v-sheet
          class="mb-2 px-2"
          v-for="{
            id,
            text,
            sender,
            hasTimeGap,
            creationTime,
            isDifferentSender,
          } of messages"
          :key="id"
        >
          <v-row
            v-if="hasTimeGap"
            class="text-caption text--secondary"
            justify="center"
          >
            {{ creationTime }}
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
    <v-form ref="form">
      <v-sheet class="d-none d-sm-block">
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
      <v-sheet color="primary" class="d-sm-none" style="overflow: hidden">
        <v-container>
          <v-row no-gutters>
            <v-col class="py-0">
              <v-textarea
                v-model="textInput"
                no-resize
                autofocus
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
import { messages } from "../apis";

/**@typedef {import('../apis/messages').Message} Message */

export default {
  name: "Chatroom",

  data() {
    return {
      textInput: "",
      topExposed: false,
      messagesHead: 0,
    };
  },

  props: {
    chatroomID: Number,
  },

  computed: {
    ...mapState(["user"]),
    ...mapGetters(["users"]),
    /**@returns {Message[]} */
    allMessages() {
      return this.$store.getters.messages(this.chatroomID);
    },
    /**@returns {Message[]} */
    messages() {
      return this.allMessages.slice(this.messagesHead);
    },
    /**@returns {boolean} */
    autoGrow() {
      return this.textInput.split("\n").length < 4;
    },
  },

  watch: {
    chatroomID() {
      this.init();
    },
    allMessages() {
      this.scrollToBottom();
    },
    async topExposed(exposed) {
      if (!exposed) return;
      while (this.topExposed && this.messagesHead > 0) {
        this.messagesHead--;
        await new Promise((r) => setTimeout(r, 50));
      }
    },
  },

  methods: {
    init() {
      this.messagesHead = this.allMessages.length - 40;
      this.scrollToBottom();
    },
    /**
     * Create a message, and the syncer will update messages automatically.
     */
    send() {
      if (!this.textInput || !this.$refs.form.validate()) return;
      messages.create({ text: this.textInput, chatroom: this.chatroomID });
      this.textInput = "";
    },
    scrollToBottom() {
      const el = this.$refs["msgs-container"];
      this.$vuetify.goTo(9999, { container: el });
    },
  },
  mounted() {
    this.init();
  },
};
</script>