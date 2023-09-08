// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
const presets = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...presets,
  preset: 'jest-expo',
  setupFiles: [
    '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
    '../../node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  collectCoverage: false, // only collect in CI
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/test/**', // test helpers
    '!src/**/*.stories.**',
    '!src/abis/**', // auto-generated
    '!**/__generated__/**', // auto-generated
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      // slightly below current test coverage to prevent failing prs for now
      // while preventing further regressions
      lines: 21.5,
    },
  },
  clearMocks: true,
}
