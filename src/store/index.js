import Vue from "vue";
import Vuex from "vuex";
import { auth, messages } from "../apis";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {},
    users: {},
    messages: {},
  },
  getters: {
    authed(state) {
      return !!state.user.id;
    },
    latestSyncedMessageID(state) {
      const keys = Object.keys(state.messages);
      return keys.length ? Math.max(...keys) : 0;
    },
  },
  mutations: {
    auth(state, { user = {} } = {}) {
      state.user = user;
      Vue.set(state.users, user.id, user);
    },
    appendUsers(state, { users }) {
      for (const user of users) {
        Vue.set(state.users, user.id, user);
      }
    },
    appendMessages(state, { messages }) {
      for (const msg of messages) {
        Vue.set(state.messages, msg.id, msg);
      }
    },
  },
  actions: {
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
    async syncMessages({ getters, commit, dispatch }) {
      const { next, results } = await messages.list(
        getters.latestSyncedMessageID + 1
      );
      commit("appendMessages", { messages: results });
      if (next) await dispatch("syncMessages");
    },
  },
  modules: {},
});
