// metro.config.js

const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// SVG Support
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts.push("svg");

// Polyfill Node core modules for React Native (only as needed)
config.resolver.extraNodeModules = {
  stream: require.resolve("stream-browserify"),
  ...require("node-libs-react-native"),
  fs: require.resolve("react-native-level-fs"),
  net: require.resolve("node-libs-react-native/mock/net"),
  tls: require.resolve("node-libs-react-native/mock/tls")
};
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
