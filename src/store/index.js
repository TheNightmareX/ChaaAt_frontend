import Vue from "vue";
import Vuex from "vuex";
import * as apis from "../apis";

/**@typedef {import("../apis/auth").User} User */
/**@typedef {import("../apis/messages").Message} Message */
/**@typedef {import("../apis/friend-relations").Relation} FriendRelation */
/**@typedef {import("axios").CancelToken} CancelToken */

/**@typedef {{ creationTime: Date, hasTimeGap: boolean, isDifferentSender: boolean, id: number, text: string, sender: number, chatroom: number }} AnalyzedMessage */
/**@typedef {{ id: number, user: User, asSender: boolean, chatroom: number }} AnalyzedFriendRelation */

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    /**@type {User} */
    user: { id: undefined, username: undefined },
    activeChatroomID: 0,
  },
  getters: {
    authed(state) {
      return !!state.user.id;
    },
    users(state, getters) {
      const users = { [state.user.id]: state.user };
      for (const relationSet of Object.values(
        getters["friendRelations/relations"]
      )) {
        for (const relation of relationSet) {
          users[relation.user.id] = relation.user;
        }
      }
      return users;
    },
  },
  mutations: {
    /**
     * Set the auth state if params are provided, otherwise reset the auth state and data.
     */
    auth(
      state,
      /**@type {{ user: User }} */
      { user } = { user: undefined }
    ) {
      if (user) {
        state.user = user;
      } else {
        state.messages.messages = {};
        state.messages.loaded = false;
        state.friendRelations.relations = {};
        state.friendRelations.loaded = false;
      }
    },
    switchChatroom(
      state,
      /**@type {{ chatroomID: number }} */
      { chatroomID }
    ) {
      state.activeChatroomID = chatroomID;
    },
  },
  actions: {
    /**
     * Login if params are provided, otherwise load the current auth state.
     */
    async login(
      { commit },
      /**@type {{ username: string, password: string }} */
      { username, password } = { username: undefined, password: undefined }
    ) {
      commit("auth", {
        user:
          username && password
            ? await apis.auth.login({ username, password })
            : await apis.auth.current(),
      });
    },
    async logout({ commit }) {
      await apis.auth.logout();
      commit("auth");
    },
    async sync(
      { commit },
      /**@type {{ cancelToken: CancelToken }} */
      { cancelToken } = { cancelToken: undefined }
    ) {
      const updates = await apis.updates.list({ cancelToken });
      updates.forEach(([label, data]) => {
        switch (label) {
          case "friend_relation.create":
            commit("friendRelations/append", { relations: [data] });
            break;
          case "friend_relation.destroy":
            commit("friendRelations/delete", { relationID: data });
            break;
          case "message.create":
            commit("messages/append", { messages: [data] });
            break;
        }
      });
    },
  },
  modules: {
    messages: {
      namespaced: true,
      state: {
        /**@type {Object<string, Message>} */
        messages: {},
      },
      getters: {
        messageMapping(state) {
          /**@type {Message[]} */
          const messages = Object.values(state.messages);

          /**
           * categorized according to the chatroom
           * @type {Object<string, Message[]>}
           */
          const mapping = {};
          messages.forEach((msg) => {
            const key = msg.chatroom;
            mapping[key] = mapping[key] ?? [];
            mapping[key].push(msg);
          });

          return mapping;
        },
        analyzedMessageMapping(state, getters) {
          /**@type {Object<string, AnalyzedMessage[]>} */
          const analyzedMapping = {};
          /**@type {[string, Message[]][]} */
          const entries = Object.entries(getters.messageMapping);
          entries.forEach(([chatroomID, messages]) => {
            analyzedMapping[chatroomID] = messages.map((message, index) => {
              const INTERVAL = 60000 * 1;
              const previous = messages[index - 1];
              const creationTime = new Date(message.creationTime);
              return {
                ...message,
                creationTime: creationTime,
                hasTimeGap:
                  !previous ||
                  creationTime.getTime() -
                    new Date(previous.creationTime).getTime() >
                    INTERVAL,
                isDifferentSender:
                  !previous || message.sender != previous.sender,
              };
            });
          });
          return analyzedMapping;
        },
      },
      mutations: {
        append(
          state,
          /**@type {{ messages: Message[] }} */
          { messages }
        ) {
          messages.forEach((msg) => Vue.set(state.messages, msg.id, msg));
        },
      },
      actions: {
        async load({ commit }) {
          await apis.messages.list({
            forEach: (messages) => commit("append", { messages }),
          });
        },
      },
    },
    friendRelations: {
      namespaced: true,
      state: {
        /**@type {Object<string, FriendRelation>} */
        relations: {},
        fixedMapping: {},
      },
      getters: {
        relations(state, getters, rootState) {
          /**@type {Object<string, FriendRelation>} */
          const allRelations = state.relations;
          const accepted = [];
          const pending = [];
          for (const id in allRelations) {
            const {
              sourceUser,
              targetUser,
              accepted: isAccepted,
              chatroom,
            } = allRelations[id];
            /**@type {User} */
            const currentUser = rootState.user;
            const asSender = sourceUser.username == currentUser.username;
            const user = asSender ? targetUser : sourceUser;
            (isAccepted ? accepted : pending).push({
              id,
              user,
              asSender,
              chatroom,
            });
          }
          return { accepted, pending };
        },
      },
      mutations: {
        append(
          state,
          /**@type {{ relations: FriendRelation[] }} */
          { relations }
        ) {
          relations.forEach((r) => Vue.set(state.relations, r.id, r));
        },
        delete(
          state,
          /**@type {{ relationID: number }} */
          { relationID }
        ) {
          Vue.delete(state.relations, relationID);
        },
        setFixed(
          state,
          /**@type {{ relationID: number, fixed: boolean }} */
          { relationID, fixed = undefined }
        ) {
          Vue.set(
            state.fixedMapping,
            relationID,
            fixed != undefined ? fixed : !state.fixedMapping[relationID]
          );
        },
      },
      actions: {
        async load({ commit }) {
          await apis.friendRelations.list({
            forEach: (relations) => commit("append", { relations }),
          });
        },
      },
    },
  },
});
