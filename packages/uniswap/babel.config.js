const { NODE_ENV } = process.env

const inProduction = NODE_ENV === 'production'

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)

  var plugins = [
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
