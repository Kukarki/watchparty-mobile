const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-webrtc uses event-target-shim/index which isn't exposed via
// the package's exports field. Disable strict package exports so Metro falls
// back to file-based resolution for packages that haven't updated yet.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
