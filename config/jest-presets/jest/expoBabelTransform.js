const { resolveBabelOptions } = require('jest-expo/src/resolveBabelOptions')

// jest-expo hardcodes the babel caller platform to 'ios', which babel-preset-expo inlines
// as process.env.EXPO_OS. jsdom suites resolve expo's web winter runtime, whose HMR client
// needs EXPO_OS==='web'; this returns a babel-jest transform that overrides only the platform.
function expoBabelTransform(platform, projectRoot) {
  return ['babel-jest', { ...resolveBabelOptions(projectRoot), caller: { name: 'metro', bundler: 'metro', platform } }]
}

module.exports = { expoBabelTransform }
