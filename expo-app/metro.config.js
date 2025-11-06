const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Add watchFolders for monorepo
config.watchFolders = [monorepoRoot];

// Add resolver configuration for monorepo packages
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
  extraNodeModules: {
    "@liftledger/shared": path.resolve(monorepoRoot, "packages/shared"),
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });