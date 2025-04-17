// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  displayName: 'Utilities Package',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
    '@tamagui/web': '@tamagui/core/native-test',
  },
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  setupFilesAfterEnv: [
    '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
  ],
}
