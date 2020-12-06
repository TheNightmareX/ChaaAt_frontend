import Vue from "vue";
import VueRouter from "vue-router";
import store from "../store";

import Chatrooms from "../views/chatrooms/Chatrooms";
import Auth from "../views/auth/Auth";
import Login from "../views/auth/children/Login";
import Signup from "../views/auth/children/Signup";

Vue.use(VueRouter);

/**@type {import("vue-router").RouteConfig[]} */
const routes = [
  {
    path: "*",
    redirect: { name: "Chatrooms" },
  },
  {
    path: "/chatrooms/",
    name: "Chatrooms",
    component: Chatrooms,
  },
  {
    path: "/auth/",
    name: "Auth",
    component: Auth,
    redirect: { name: "Login" },
    children: [
      {
        path: "login/",
        name: "Login",
        component: Login,
      },
      {
        path: "signup/",
        name: "Signup",
        component: Signup,
      },
    ],
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

let initialized = false;

/**
 * Redirect to the auth page when not authed. 
 * Perform the initial auth when it's the first route.
 */
router.beforeResolve(async (to, from, next) => {
  if (!initialized) {
    await store.dispatch("login");
    initialized = true;
  }

  const whiteList = ["Login", "Signup", "Auth"];
  if (store.getters.authed || whiteList.includes(to.name)) {
    // when going to auth or authed
    next();
  } else {
    // when not authed
    next({ name: "Login", query: { next: to.fullPath } });
  }
});

export default router;
