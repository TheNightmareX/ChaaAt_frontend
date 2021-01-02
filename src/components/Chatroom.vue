<template>
  <v-sheet class="d-flex flex-column fill-height">
    <v-sheet
      ref="msgs-scroller"
      class="flex-grow-1"
      style="height: 0; overflow: auto"
    >
      <v-container fluid style="position: relative">
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
            ([entry]) =>
              (messageVisibilityMapping = inited
                ? {
                    ...messageVisibilityMapping,
                    [id]: entry.isIntersecting,
                  }
                : {})
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

        <v-row
          id="msgs-container-bottom"
          style="position: absolute; bottom: 0"
        ></v-row>
      </v-container>
    </v-sheet>

    <v-sheet style="position: relative">
      <v-snackbar
        :value="updatedMessages.length"
        color="info"
        timeout="-1"
        absolute
      >
        {{ updatedMessages.length }}条新消息
        <template #action>
          <v-btn icon @click="scrollToBottom">
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </v-sheet>

    <MessageInput></MessageInput>
  </v-sheet>
</template>

<script>
import "vuetify";
import { mapGetters, mapState } from "vuex";
import MessageInput from "./MessageInput";

/**@typedef {import('../store').AnalyzedMessage} Message */

export default {
  name: "Chatroom",

  components: { MessageInput },

  data: () => ({
    inited: false,
    textInput: "",
    renderMessageFrom: 0,
    /**@type {Object<string, boolean>} */
    messageVisibilityMapping: {},
    /**@type {Message[]} */
    updatedMessages: [],
  }),

  computed: {
    ...mapState(["user"]),
    ...mapState({ chatroomID: "activeChatroomID" }),
    ...mapGetters(["users"]),
    ...mapGetters("messages", ["analyzedMessageMapping"]),
    /**@returns {Message[]} */
    relatedMessages() {
      return this.analyzedMessageMapping[this.chatroomID] ?? [];
    },
    /**@returns {Message[]} */
    renderedMessages() {
      return this.relatedMessages.slice(this.renderMessageFrom);
    },
    /**@returns {boolean} */
    followingNewMessages() {
      const THRESHOLD = 3;
      return !!Object.values(this.messageVisibilityMapping).slice(
        -THRESHOLD
      )[0];
    },
    /**@returns {boolean} */
    topExposed() {
      return !!Object.values(this.messageVisibilityMapping)
        // magic to solve a strange bug
        .slice(0, 2)
        .some((visible) => visible);
    },
  },

  watch: {
    chatroomID() {
      this.inited = false;
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
      const received = differences.filter((msg) => msg.sender != this.user.id);

      if (this.followingNewMessages || sent) {
        this.scrollToBottom();
      } else {
        this.updatedMessages = this.updatedMessages.concat(received);
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
    messageVisibilityMapping() {
      const updatedMessagecount = this.updatedMessages.length;
      if (!updatedMessagecount) return;

      const nearBottom = Object.values(this.messageVisibilityMapping).slice(
        -updatedMessagecount
      )[0];
      if (!nearBottom) return;

      const updatedMessageSet = new Set(this.updatedMessages);
      for (const message of this.updatedMessages) {
        if (this.messageVisibilityMapping[message.id])
          updatedMessageSet.delete(message);
      }
      this.updatedMessages = [...updatedMessageSet];
    },
  },

  methods: {
    async init() {
      const INIT_SIZE = 20;
      const msgCount = this.relatedMessages.length;
      this.renderMessageFrom = msgCount > INIT_SIZE ? msgCount - INIT_SIZE : 0;

      this.messageVisibilityMapping = {};

      await this.$nextTick();
      await this.$vuetify.goTo(0, {
        container: this.$refs["msgs-scroller"],
        duration: 0,
      });
      await this.scrollToBottom();

      this.inited = true;
    },
    async scrollToBottom() {
      await this.$vuetify.goTo("#msgs-container-bottom", {
        container: this.$refs["msgs-scroller"],
      });
    },
  },
  mounted() {
    this.init();
  },
};
</script>