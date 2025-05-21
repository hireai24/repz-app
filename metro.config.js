const { getDefaultConfig } = require("@expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // Configure transformer
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  };

  // Configure resolver
  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...config.resolver.sourceExts, "svg"],
    blacklistRE: exclusionList([
      /backend\/.*/,
      /ai\/.*/,
      /admin\/.*/,
      /functions\/.*/,
    ]),
  };

  return config;
})();
