<template>
  <v-app>
    <template v-if="inited">
      <v-fade-transition>
        <router-view></router-view>
      </v-fade-transition>

      <Notifier ref="notifier"></Notifier>
    </template>

    <v-overlay :value="!inited">
      <v-progress-circular
        indeterminate
        size="100"
        width="7"
      ></v-progress-circular>
    </v-overlay>
  </v-app>
</template>

<script lang="ts">
import * as models from "@/models";
import { Component, Ref, Vue } from "vue-property-decorator";
import Notifier from "@/components/Notifier.vue";

declare module "vue/types/vue" {
  interface Vue {
    $context: {
      user: models.User;
      isMobile: boolean;
    };

    $notifier: Notifier;
  }
}

@Component({
  components: { Notifier },
})
export default class extends Vue {
  @Ref() notifier!: Notifier;

  inited = false;

  setProtoAttrs() {
    Vue.prototype.$context = new Vue({
      data: {
        user: null,
      },

      computed: {
        isMobile: () => this.$vuetify.breakpoint.xsOnly,
      },
    });

    Object.defineProperty(Vue.prototype, "$notifier", {
      get: () => this.notifier,
      configurable: true,
    });
  }

  setRouteGuards() {
    this.$router.beforeEach((to, from, next) => {
      if (
        to.name &&
        !to.matched.some((record) => record.meta.noAuth) &&
        !this.$context.user
      )
        next({ name: "Login" });
      else next();
    });
  }

  async created() {
    this.setProtoAttrs();
    this.setRouteGuards();

    try {
      const authInfo = await new models.AuthHandler().getAuthInfo();

      this.$context.user = await new models.UserResourceHandler().retrieve(
        authInfo.pk
      );
    } catch (e) {
      console.debug(e);
      this.$router.push({ name: "Login" });
    } finally {
      this.inited = true;
    }
  }
}
</script>