// metro.config.js

const { getDefaultConfig } = require("@expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // ✅ Ensure Hermes-safe resolution
  config.resolver.unstable_enablePackageExports = false;

  // ✅ Polyfill required Node.js core modules
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    assert: require.resolve("empty-module"),
    http: require.resolve("empty-module"),
    https: require.resolve("empty-module"),
    os: require.resolve("empty-module"),
    url: require.resolve("empty-module"),
    zlib: require.resolve("empty-module"),
    path: require.resolve("empty-module"),
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("readable-stream"),
    buffer: require.resolve("buffer"),
    process: require.resolve("process/browser"),
  };

  // ✅ Hermes-compatible transformer with SVG support
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
    assetPlugins: ["expo-asset/tools/hashAssetFiles"],
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    runtimeRequireWarning: true,
  };

  // ✅ Handle SVG as source (JSX) instead of asset
  config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== "svg",
  );
  config.resolver.sourceExts.push("svg");

  // ✅ Block all server-side/backend code from bundling
  config.resolver.blockList = exclusionList([
    /backend\/.*/,
    /ai\/.*/,
    /admin\/.*/,
    /functions\/.*/,
  ]);

  return config;
})();
