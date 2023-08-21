// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
const globals = require('../../config/jest-presets/jest/globals')

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest-setup.js', '../../node_modules/react-native-gesture-handler/jestSetup.js'],
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
  // consider enabling for speed
  // changedSince: 'master',
  // https://github.com/facebook/jest/issues/2663#issuecomment-341384494
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
  transform: {
    '\\.svg$': 'jest-transformer-svg',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|uuid|react-native-reanimated|react-native-splash-screen|statsig-js|statsig-react-native|@react-native|@react-native-firebase|react-native-webview|@gorhom|expo.*|react-native-flipper|d3-(array|color|format|interpolate|path|scale|shape|time-format|time)|internmap|react-native-qrcode-svg|react-native-modal|react-native-animatable|react-native-masked-view|redux-persist|react-native-url-polyfill|react-native-context-menu-view|react-native-wagmi-charts|react-native-markdown-display|react-native-redash|@walletconnect)/)',
  ],
  ...globals,
}
