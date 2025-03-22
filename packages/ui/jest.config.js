/* eslint-env es6, es2017, es2018 */

const preset = require('../../config/jest-presets/jest/jest-preset');

const { NODE_ENV } = process.env;

/**
 * Babel config for the UI package. This is inside the jest config because
 * at the time of configuration there was no babel config for the UI package.
 */
const babelConfig = {
  presets: ['module:@react-native/babel-preset', '@babel/preset-typescript'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        path: '../../.env.defaults',
        safe: true,
        allowUndefined: false,
      },
    ],
    // React Native Reanimated plugin fix
    '@babel/plugin-proposal-export-namespace-from',
  ].filter(Boolean),
};

module.exports = {
  ...preset,
  preset: 'jest-expo',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
      {
        presets: babelConfig.presets,
        plugins: babelConfig.plugins,
      },
    ],
  },
  displayName: 'UI Package',
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.stories.**',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 0,
    },
  },
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '@tamagui/core': '@tamagui/core/native-test',
    '@tamagui/web': '@tamagui/core/native-test',
  },
  setupFiles: [
    '../../config/jest-presets/jest/setup.js',
    './jest-setup.js',
    '../../node_modules/react-native-gesture-handler/jestSetup.js',
  ],
};
