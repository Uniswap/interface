module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        safe: true,
        allowUndefined: false,
      },
    ],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanOCR'],
      },
    ],
    // TypeScript compiles this, but in production builds, metro doesn't use tsc
    '@babel/plugin-proposal-logical-assignment-operators',
    // metro doesn't like these
    '@babel/plugin-proposal-numeric-separator',
  ],
}
