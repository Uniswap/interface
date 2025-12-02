const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  testTimeout: 15000,
  testEnvironmentOptions: {
    ...preset.testEnvironmentOptions,
    customExportConditions: ['react-native'],
  },
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
  ],
}
