const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.blockList = [
  /\.local\/.*/,
  /server_dist\/.*/,
  /static-build\/.*/,
  /podcast-audio\/.*/,
];

module.exports = config;
