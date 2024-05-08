// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  preset: 'jest-expo',
  displayName: 'Wallet Package',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!src/abis/**', // auto-generated abis
    '!src/data/__generated__/**', // auto-generated graphql
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  haste: {
    defaultPlatform: 'ios',
    // avoid native because wallet tests assume no .native.ts
    platforms: ['web', 'ios', 'android'],
  },
  setupFiles: [
    './jest-setup.js',
  ],
  // we map core to tamagui's test bundle, this just makes setup simpler for jest
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
  },
}
