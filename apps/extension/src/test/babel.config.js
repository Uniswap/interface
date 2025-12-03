// This file is used only by jest in the test environment. To check the extension
// build set up, see the webpack.config.js file.

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)
  var plugins = [
    'react-native-web',
    [
      'module:react-native-dotenv',
      {
        moduleName: 'react-native-dotenv',
        path: '../../.env.defaults',
        safe: true,
        allowUndefined: false,
      },
    ],
    // https://github.com/software-mansion/react-native-reanimated/issues/3364#issuecomment-1268591867
    '@babel/plugin-proposal-export-namespace-from',
    'react-native-reanimated/plugin',
  ].filter(Boolean)

  return {
    presets: ['babel-preset-expo'],
    plugins,
  }
}
