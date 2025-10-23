// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
    // FIXME(INFRA-1034): `utilities` shouldn't use jest-expo since it doesn't have React-Native specific code </3,
    // but our default es-jest preset is not correctly configured to handle ESM imports while our jest-expo config is..
    // Babel.config.js was copied over from packages/uniswap to get jest-expo working here to unblock 
    // Remove once we update jest -> vitest
  preset: 'jest-expo', 
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
  setupFiles: [
    // '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
  ],
}
