module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "@babel/plugin-transform-runtime",
        {
          corejs: 3,
          helpers: true,
          regenerator: true,
          useESModules: false,
        },
      ],
      "@babel/plugin-proposal-optional-catch-binding",
      "react-native-reanimated/plugin", // 👈 Must always be last
    ],
  };
};
