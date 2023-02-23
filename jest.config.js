module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest-setup.js', './node_modules/react-native-gesture-handler/jestSetup.js'],
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
    'node_modules/(?!(react-native|react-native-reanimated|@react-native|@react-native-firebase|react-native-webview|@gorhom|expo.*|react-native-flipper|d3-(array|color|format|interpolate|path|scale|shape|time-format|time)|internmap|react-native-qrcode-svg|react-native-modal|react-native-animatable|react-native-masked-view|redux-persist|react-native-url-polyfill|react-native-context-menu-view|react-native-wagmi-charts|react-native-markdown-display|react-native-redash|@walletconnect)/)',
  ],
  // define environment variables
  globals: {
    ALCHEMY_API_KEY: 123,
    AMPLITUDE_API_KEY: 123,
    AMPLITUDE_API_TEST_KEY: 123,
    AMPLITUDE_EXPERIMENTS_DEPLOYMENT_KEY: 123,
    DEMO_SEED_PHRASE: 'test',
    MOONPAY_API_KEY: 123,
    MOONPAY_API_URL: 'https://api.moonpay.com',
    MOONPAY_WIDGET_API_URL: 'https://api.moonpay.com',
    INFURA_PROJECT_ID: 123,
    ONESIGNAL_APP_ID: 123,
    SENTRY_DSN: 'http://sentry.com',
    SHAKE_CLIENT_ID: 123,
    SHAKE_CLIENT_SECRET: 123,
    STATSIG_API_KEY: 123,
    STATSIG_PROXY_URL: 'https://api.statsig.com',
    UNISWAP_API_KEY: 123,
    UNISWAP_API_BASE_URL: 'https://api.uniswap.org',
    WALLETCONNECT_PROJECT_ID: 123,
  },
}
