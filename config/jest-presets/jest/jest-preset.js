// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
const globals = require('./globals');

/** @type any */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '\\.svg$': 'jest-transformer-svg',
  },
  // coverageDirectory: '<rootDir>/coverage',
  // coverageReporters: ['json','lcov','html'],
  // collectCoverageFrom: [
  //   '<rootDir>/packages/**/src/**/*.ts',
  // ],
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'mjs',
    'cjs',
    'jsx',
    'json',
    'node',
    'mp4',
  ],
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2|mp4)$':
      'jest-transform-stub',
    // Jest by default doesn't support absolute imports out of the box
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['<rootDir>/node_modules'],
  testMatch: ['<rootDir>/**/*.(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/../../config/jest-presets/jest/setup.js'],
  // consider enabling for speed
  // changedSince: 'master',
  // https://github.com/facebook/jest/issues/2663#issuecomment-341384494
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$':
      'jest-transform-stub',
  },
  transform: {
    '\\.svg$': 'jest-transformer-svg',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|uuid|react-native-reanimated|react-native-safe-area-context|react-native-localize|react-native-splash-screen|@react-native-masked-view|statsig-js|statsig-react-native|statsig-react|@react-native|@react-native-firebase|react-native-webview|@gorhom|expo.*|react-native-flipper|d3-(array|color|format|interpolate|path|scale|shape|time-format|time)|internmap|react-native-qrcode-svg|react-native-modal|react-native-animatable|react-native-masked-view|redux-persist|react-native-url-polyfill|react-native-context-menu-view|react-native-wagmi-charts|react-native-markdown-display|react-native-redash|@walletconnect|moti|react-native-image-picker)/)',
  ],
  collectCoverage: false, // only collect in CI
  clearMocks: true,
  ...globals,
};
