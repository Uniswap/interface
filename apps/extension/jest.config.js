const preset = require('../../config/jest-presets/jest/jest-preset')

// Set APP_ID at jest config-load time so it's inherited by all forked workers
// before @universe/config is evaluated. Overrides the default in
// config/jest-presets/jest/globals.js.
process.env.APP_ID = 'extension'

const fileExtensions = ['eot', 'gif', 'jpeg', 'jpg', 'otf', 'png', 'ttf', 'woff', 'woff2', 'mp4']

module.exports = {
  ...preset,
  preset: 'jest-expo',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        configFile: './src/test/babel.config.js',
      },
    ],
  },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^react-native$': 'react-native-web',
  },
  moduleFileExtensions: ['web.js', 'web.jsx', 'web.ts', 'web.tsx', ...fileExtensions, ...preset.moduleFileExtensions],
  resolver: '<rootDir>/src/test/jest-resolver.js',
  displayName: 'Extension Wallet',
  testMatch: ['<rootDir>/src/**/*.(spec|test).[jt]s?(x)', '<rootDir>/config/**/*.(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [...preset.testPathIgnorePatterns, '<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/app/**/*.{js,ts,tsx}',
    'src/background/**/*.{js,ts,tsx}',
    'src/contentScript/**/*.{js,ts,tsx}',
    'config/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  setupFiles: ['../../config/jest-presets/jest/setup.js', './jest-setup.js'],
}
