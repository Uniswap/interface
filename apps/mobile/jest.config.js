const preset = require('../../config/jest-presets/jest/jest-preset')

module.exports = {
  ...preset,
  testTimeout: 15000,
  // Recycle workers before jest+jsdom memory bloat hits the inherited --max-old-space-size.
  workerIdleMemoryLimit: '1.5GB',
  // jsdom variant that installs Web Streams globals expo's winter native runtime needs.
  testEnvironment: require.resolve('../../config/jest-presets/jest/expoWinterEnvironment.js'),
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
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['./jest-setup.js'],
  setupFilesAfterEnv: [...preset.setupFilesAfterEnv, '<rootDir>/../../config/jest-presets/jest/rntl-setup.js'],
}
