// File: babel.config.js
// Description: Babel configuration for React Native with Reanimated support

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
