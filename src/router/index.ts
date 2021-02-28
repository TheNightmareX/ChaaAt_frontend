import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    name: "Index",
    path: "/",
    component: () => import("@/views/index.vue"),
  },

  {
    path: "/auth/",
    redirect: { name: "Login" },
    component: () => import("@/views/auth/index.vue"),
    meta: { noAuth: true },

    children: [
      {
        name: "Login",
        path: "login/",
        component: () => import("@/views/auth/login/index.vue"),
      },

      {
        name: "Signup",
        path: "signup/",
        component: () => import("@/views/auth/signup/index.vue"),
      },
    ],
  },

  {
    path: "*",
    redirect: { name: "Index" },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
