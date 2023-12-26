const presets = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...presets,
  preset: 'jest-expo',
  displayName: 'Mobile Wallet',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/test/**', // test helpers
    '!src/**/*.stories.**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  setupFiles: [
    '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
    '../../node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  // we map core/web to tamagui's test bundle, this just makes setup simpler for jest
  moduleNameMapper: {
    ...presets.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
    '@tamagui/web': '@tamagui/core/native-test',
  },
}
