import Vue from "vue";
import Vuex from "vuex";
import { auth, friendRelations, messages } from "../apis";

/**@typedef {import("../apis/auth").User} User */
/**@typedef {import("../apis/messages").Message} Message */
/**@typedef {import("../apis/friend-relations").Relation} FriendRelation */

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    /**@type {User} */
    user: {},
    /**@type {Object<number, Message>} */
    messages: {},
    messagesLoaded: false,
    /**@type {Object<number, FriendRelation>} */
    friendRelations: {},
    friendRelationsLoaded: false,
  },
  getters: {
    authed(state) {
      return !!state.user.id;
    },
    users(state, getters) {
      const users = { [state.user.id]: state.user };
      for (const relationSet of Object.values(getters.friendRelations)) {
        for (const relation of relationSet) {
          users[relation.user.id] = relation.user;
        }
      }
      return users;
    },
    messages(state) {
      state.messages;
      return (chatroomID) => {
        /**@type {Message[]} */
        const all = Object.values(state.messages);
        const filtered = all.filter(
          (message) => message.chatroom == chatroomID
        );
        const computed = filtered.map((message, index) => {
          const INTERVAL = 60000 * 1;
          const previous = filtered[index - 1];
          const creation = new Date(message.creationTime);
          return {
            ...message,
            creationTime: creation.toLocaleString(undefined, { hour12: false }),
            hasTimeGap:
              !previous ||
              creation - new Date(previous.creationTime) > INTERVAL,
            isDifferentSender: !previous || message.sender != previous.sender,
          };
        });
        return computed;
      };
    },
    friendRelations(state) {
      const accepted = [];
      const pending = [];
      for (const id in state.friendRelations) {
        const {
          sourceUser,
          targetUser,
          accepted: isAccepted,
          chatroom,
        } = state.friendRelations[id];
        const asSender = sourceUser.username == state.user.username;
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
    /**
     * Set the auth state if params are provided, otherwise reset the auth state and data.
     */
    auth(state, { user } = {}) {
      if (user) {
        state.user = user;
      } else {
        state.messages = {};
        state.messagesLoaded = false;
        state.friendRelations = {};
        state.friendRelationsLoaded = false;
      }
    },
    appendMessages(state, { messages }) {
      for (const msg of messages) {
        Vue.set(state.messages, msg.id, msg);
      }
      state.messagesLoaded = true;
    },
    appendFriendRelations(state, { relations }) {
      for (const relation of relations) {
        Vue.set(state.friendRelations, relation.id, relation);
      }
      state.friendRelationsLoaded = true;
    },
    deleteFriendRelation(state, { id }) {
      Vue.delete(state.friendRelations, id);
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
            ? await auth.login(username, password)
            : await auth.current(),
      });
    },
    async logout({ commit }) {
      await auth.logout();
      commit("auth");
    },
    /**
     * Load all the messages when it is called for the first time
     * , otherwise sync messages.
     */
    async syncMessages({ state, commit }, { cancelToken = undefined } = {}) {
      if (!state.messagesLoaded) {
        messages.clearUpdations();
        let nextPage = 1;
        while (nextPage) {
          const { next, results } = await messages.list(nextPage);
          next ? nextPage++ : (nextPage = false);
          commit("appendMessages", { messages: results });
        }
      } else {
        const updations = await messages.getUpdations(cancelToken);
        commit("appendMessages", { messages: updations });
      }
    },
    /**
     * Load all the friend relations when it is called for the first time
     * , otherwise sync friend relations.
     */
    async syncFriendRelations(
      { state, commit },
      { cancelToken = undefined } = {}
    ) {
      if (!state.friendRelationsLoaded) {
        friendRelations.clearUpdations();
        let nextPage = 1;
        while (nextPage) {
          const { next, results } = await friendRelations.list(nextPage);
          next ? nextPage++ : (nextPage = false);
          commit("appendFriendRelations", {
            relations: results,
          });
        }
      } else {
        const updations = await friendRelations.getUpdations(cancelToken);
        for (const [action, value] of updations) {
          switch (action) {
            case "save":
              commit("appendFriendRelations", { relations: [value] });
              break;
            case "delete":
              commit("deleteFriendRelation", { id: value });
              break;
          }
        }
      }
    },
  },
  modules: {},
});
