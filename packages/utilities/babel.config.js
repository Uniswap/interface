/**
 * FIXME(INFRA-1034):Babel config is copied over from packages/uniswap/babel.config.js to get jest-expo working in `utilities`
 * (Our es-jest is currently incorrectly configured to handle ESM imports while our jest-expo config is </3 )
 *
 * Remove this config once we update jest -> vitest
 */

const { NODE_ENV } = process.env

const inProduction = NODE_ENV === 'production'
const inTest = NODE_ENV === 'test'

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)

  let plugins = inProduction ? ['transform-remove-console'] : []
  if (!inTest) {
    plugins.push('transform-inline-environment-variables')
  }

  plugins = [
    ...plugins,
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

    // TypeScript compiles this, but in production builds, metro doesn't use tsc
    '@babel/plugin-proposal-logical-assignment-operators',
    // metro doesn't like these
    '@babel/plugin-proposal-numeric-separator',
    // https://github.com/software-mansion/react-native-reanimated/issues/3364#issuecomment-1268591867
    '@babel/plugin-proposal-export-namespace-from',
    // 'react-native-reanimated/plugin' must be listed last
    // https://arc.net/l/quote/plrvpkad
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes', '__scanOCR'],
      },
    ],
  ]

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins,
  }
}
