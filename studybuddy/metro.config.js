// File: metro.config.js
// Description: Metro configuration for React Native

const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for React Native
 * Uses default configuration without custom transformer to avoid errors
 */
const config = getDefaultConfig(__dirname);

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
