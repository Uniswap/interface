// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
const globals = require('./globals')

/** @type any */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['react-native'],
  },
  transform: {
    '\\.svg$': 'jest-transformer-svg',
    '^.+\\.jsx?$': 'babel-jest',
  },
  // coverageDirectory: '<rootDir>/coverage',
  // coverageReporters: ['json','lcov','html'],
  // collectCoverageFrom: [
  //   '<rootDir>/packages/**/src/**/*.ts',
  // ],
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['jest.tsx', 'jest.ts', 'ts', 'tsx', 'js', 'mjs', 'cjs', 'jsx', 'json', 'node', 'mp4'],
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2|mp4)$': 'jest-transform-stub',
    // Jest by default doesn't support absolute imports out of the box
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/node_modules'],
  testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/dist'],
  testMatch: ['<rootDir>/**/*.(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/../../config/jest-presets/jest/setup.js'],
  // consider enabling for speed
  // changedSince: 'master',
  // https://github.com/facebook/jest/issues/2663#issuecomment-341384494
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-web|react-native-modal-selector|react-native-modal-datetime-picker|react-native-keyboard-controller|@react-navigation|@storybook/react-native|@react-native-community/datetimepicker|react-native-image-colors|uuid|react-native-reanimated|react-native-safe-area-context|react-native-localize|@react-native-masked-view|@statsig-js/js-client|@statsig/react-native-bindings|@statsig/react-bindings|@statsig/js-local-overrides|@react-native|@react-native-firebase|@uniswap/client-embeddedwallet|@uniswap/client-data-api|@uniswap/client-pools|@uniswap/client-platform-service|@connectrpc|@bufbuild|react-native-webview|@gorhom|expo.*|d3-(array|color|format|interpolate|path|scale|shape|time-format|time)|internmap|react-native-qrcode-svg|react-native-modal|react-native-animatable|react-native-masked-view|redux-persist|react-native-url-polyfill|react-native-context-menu-view|react-native-wagmi-charts|react-native-markdown-display|react-native-redash|@walletconnect|moti|react-native-image-picker|wagmi|viem|rn-qr-generator|@solana|jayson)/)',
  ],
  collectCoverage: false, // only collect in CI
  clearMocks: true,
  ...globals,
}
