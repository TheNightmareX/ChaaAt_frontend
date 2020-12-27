<template>
  <v-form ref="form">
    <v-sheet v-if="$vuetify.breakpoint.smAndUp">
      <v-toolbar color="primary" dense flat></v-toolbar>
      <v-textarea
        v-model="text"
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
      <TextAreaRowsCalculator
        v-model="rows"
        :target="this.$el ? this.$el.querySelector('textarea') : undefined"
        :text="text"
        :widthOffset="12"
      ></TextAreaRowsCalculator>
      <v-container>
        <v-row no-gutters>
          <v-col class="py-0">
            <v-textarea
              v-model="text"
              no-resize
              rows="1"
              :auto-grow="rows < 4"
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
</template>

<script>
import { mapState } from "vuex";
import * as apis from "../apis";
import TextAreaRowsCalculator from "./TextAreaRowsCalculator";

export default {
  name: "MessageInput",

  components: { TextAreaRowsCalculator },

  data: () => ({
    rows: 0,
    text: "",
  }),

  computed: {
    ...mapState(["activeChatroomID"]),
  },

  methods: {
    /**
     * Create a message, and the syncer will update messages automatically.
     */
    send() {
      if (!this.text || !this.$refs["form"].validate()) return;
      apis.messages.create({
        message: { text: this.text, chatroom: this.activeChatroomID },
      });
      this.text = "";
    },
  },
};
</script>