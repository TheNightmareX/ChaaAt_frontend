import Vue from "vue";
import Vuex from "vuex";
import * as apis from "../apis";

/**@typedef {import("../apis/auth").User} User */
/**@typedef {import("../apis/messages").Message} Message */
/**@typedef {import("../apis/friend-relations").Relation} FriendRelation */

/**@typedef {{ creationTime: Date, hasTimeGap: boolean, isDifferentSender: boolean, id: number, text: string, sender: number, chatroom: number }} ComputedMessage */
/**@typedef {{ id: number, user: User, asSender: boolean, chatroom: number }} ComputedFriendRelation */

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    /**@type {User} */
    user: {},
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
    auth(state, { user } = {}) {
      if (user) {
        state.user = user;
      } else {
        state.messages.messages = {};
        state.messages.loaded = false;
        state.friendRelations.relations = {};
        state.friendRelations.loaded = false;
      }
    },
    switchChatroom(state, { chatroomID }) {
      state.activeChatroomID = chatroomID;
    },
  },
  actions: {
    /**
     * Login if params are provided, otherwise load the current auth state.
     */
    async login({ commit }, { username, password } = {}) {
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
  },
  modules: {
    messages: {
      namespaced: true,
      state: {
        /**@type {Object<number, Message>} */
        messages: {},
        loaded: false,
      },
      getters: {
        messagesMapping(state) {
          /**@type {Message[]} */
          const messages = Object.values(state.messages);

          /**@type {Object<number, Message[]>} */
          const mapping = {};
          messages.forEach((msg) => {
            const key = msg.chatroom;
            mapping[key] = mapping[key] ?? [];
            mapping[key].push(msg);
          });

          /**@type {Object<number, ComputedMessage[]>} */
          const computedMapping = {};
          /**@type {[number, Message][]} */
          const entries = Object.entries(mapping);
          entries.forEach(([chatroomID, messages]) => {
            computedMapping[chatroomID] = messages.map((message, index) => {
              const INTERVAL = 60000 * 1;
              const previous = messages[index - 1];
              const creationTime = new Date(message.creationTime);
              return {
                ...message,
                creationTime: creationTime,
                hasTimeGap:
                  !previous ||
                  creationTime - new Date(previous.creationTime) > INTERVAL,
                isDifferentSender:
                  !previous || message.sender != previous.sender,
              };
            });
          });

          return computedMapping;
        },
      },
      mutations: {
        append(state, { messages }) {
          messages.forEach((msg) => Vue.set(state.messages, msg.id, msg));
          state.loaded = true;
        },
      },
      actions: {
        /**
         * Load all the messages when it is called for the first time
         * , otherwise sync messages.
         */
        async sync({ state, commit }, { cancelToken = undefined } = {}) {
          if (!state.loaded) {
            await apis.messages.clearUpdations();
            let nextPage = () => apis.messages.list();
            while (nextPage) {
              const { next, results } = await nextPage();
              commit("append", { messages: results });
              nextPage = next;
            }
          } else {
            const updations = await apis.messages.getUpdations({ cancelToken });
            commit("append", { messages: updations });
          }
        },
      },
    },
    friendRelations: {
      namespaced: true,
      state: {
        /**@type {Object<number, FriendRelation>} */
        relations: {},
        loaded: false,
      },
      getters: {
        relations(state, getters, rootState) {
          const accepted = [];
          const pending = [];
          for (const id in state.relations) {
            const {
              sourceUser,
              targetUser,
              accepted: isAccepted,
              chatroom,
            } = state.relations[id];
            const asSender = sourceUser.username == rootState.user.username;
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
        append(state, { relations }) {
          relations.forEach((r) => Vue.set(state.relations, r.id, r));
          state.loaded = true;
        },
        delete(state, { id }) {
          Vue.delete(state.relations, id);
        },
      },
      actions: {
        /**
         * Load all the friend relations when it is called for the first time
         * , otherwise sync friend relations.
         */
        async sync({ state, commit }, { cancelToken = undefined } = {}) {
          if (!state.loaded) {
            apis.friendRelations.clearUpdations();
            let nextPage = () => apis.friendRelations.list();
            while (nextPage) {
              const { next, results } = await nextPage();
              commit("append", { relations: results });
              nextPage = next;
            }
          } else {
            const updations = await apis.friendRelations.getUpdations({
              cancelToken,
            });
            for (const [action, value] of updations) {
              switch (action) {
                case "save":
                  commit("append", { relations: [value] });
                  break;
                case "delete":
                  commit("delete", { id: value });
                  break;
              }
            }
          }
        },
      },
    },
  },
});
