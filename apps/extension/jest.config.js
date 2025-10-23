const preset = require('../../config/jest-presets/jest/jest-preset')

const fileExtensions = [
  'eot',
  'gif',
  'jpeg',
  'jpg',
  'otf',
  'png',
  'ttf',
  'woff',
  'woff2',
  'mp4',
]

module.exports = {
  ...preset,
  preset: 'jest-expo',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        configFile: './src/test/babel.config.js',
      }
    ],
  },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^react-native$': 'react-native-web',
  },
  moduleFileExtensions: [
    'web.js',
    'web.jsx',
    'web.ts',
    'web.tsx',
    ...fileExtensions,
    ...preset.moduleFileExtensions,
  ],
  resolver: "<rootDir>/src/test/jest-resolver.js",
  displayName: 'Extension Wallet',
  testPathIgnorePatterns: [
    ...preset.testPathIgnorePatterns,
    '<rootDir>/e2e/',
  ],
  collectCoverageFrom: [
    'src/app/**/*.{js,ts,tsx}',
    'src/background/**/*.{js,ts,tsx}',
    'src/contentScript/**/*.{js,ts,tsx}',
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
}
