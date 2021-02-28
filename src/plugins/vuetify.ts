import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import colors from "vuetify/lib/util/colors";
import zhHans from "vuetify/src/locale/zh-Hans";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: colors.teal,
        secondary: colors.cyan,
        // primary: '#ee44aa',
        // secondary: '#424242',
        // accent: '#82B1FF',
        // error: '#FF5252',
        // info: '#2196F3',
        // success: '#4CAF50',
        // warning: '#FFC107'
      },
    },
  },
  lang: {
    locales: { zhHans },
    current: "zhHans",
  },
});
