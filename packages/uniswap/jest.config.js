// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  testTimeout: 15000,
  preset: 'jest-expo',
  displayName: 'Uniswap Package',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!src/abis/**', // auto-generated abis
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'native'],
  },
  setupFiles: ['./jest-setup.js'],
  // we map core to tamagui's test bundle, this just makes setup simpler for jest
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
    '@tamagui/web': '@tamagui/core/native-test',
  },
}
