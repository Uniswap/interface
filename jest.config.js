module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest-setup.js'],
  timers: 'fake',
  // https://github.com/facebook/jest/issues/2663#issuecomment-341384494
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'identity-obj-proxy',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-reanimated|@react-native)/)',
  ],
}
