module.exports = {
  transpileDependencies: ["vuetify"],
  devServer: {
    proxy: {
      "/api": { target: "http://localhost:8000" },
      "/static": { target: "http://localhost:8000" },
      "/admin": { target: "http://localhost:8000" },
    },
  },
};
