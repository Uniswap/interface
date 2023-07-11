const { NODE_ENV } = process.env

const inProduction = NODE_ENV === 'production'

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)

  var plugins = [
    [
      'module:react-native-dotenv',
      {
        // ideally use envName here to add a mobile namespace but this doesn't work when sharing with dotenv-webpack
        moduleName: 'react-native-dotenv',
        path: '../../.env.defaults', // must use this path so this file can be shared with web since dotenv-webpack is less flexible
        safe: true,
        allowUndefined: false,
      },
    ],
    // https://github.com/software-mansion/react-native-reanimated/issues/3364#issuecomment-1268591867
    '@babel/plugin-proposal-export-namespace-from',
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes', '__scanOCR'],
      },
    ],
    'transform-inline-environment-variables',
    // TypeScript compiles this, but in production builds, metro doesn't use tsc
    '@babel/plugin-proposal-logical-assignment-operators',
    // metro doesn't like these
    '@babel/plugin-proposal-numeric-separator',
    // automatically require React when using JSX
    'react-require',
  ]

  if (inProduction) {
    // Remove all console statements in production
    plugins = [...plugins, 'transform-remove-console']
  }

  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins,
  }
}
