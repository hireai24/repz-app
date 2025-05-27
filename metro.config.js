const { getDefaultConfig } = require("@expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // ✅ Disable modern exports resolution (Hermes compatibility)
  config.resolver.unstable_enablePackageExports = false;

  // ✅ ADD: Polyfill Node.js core modules (ONLY works in EAS Dev Client)
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
    process: require.resolve("process/browser"), // ✅ missing comma fixed here
  };

  // ✅ SVG support
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    assetPlugins: ["expo-asset/tools/hashAssetFiles"], // Hermes-safe image handling
    runtimeRequireWarning: true, // Warn about dynamic require
  };

  // ✅ Hermes-safe SVG fix (Prettier-compliant format)
  config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== "svg",
  );
  config.resolver.sourceExts.push("svg");

  // ✅ Block backend & server files from frontend bundle
  config.resolver.blockList = exclusionList([
    /backend\/.*/,
    /ai\/.*/,
    /admin\/.*/,
    /functions\/.*/,
  ]);

  return config;
})();
