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
  // Override moduleFileExtensions to NOT prioritize .web.ts for native tests
  // This ensures mobile tests use moti animations from index.ts, not CSS from index.web.ts
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
  ],
  setupFiles: [
    '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
  ],
}
