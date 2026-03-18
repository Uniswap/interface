const { NODE_ENV } = process.env

const inProduction = NODE_ENV === 'production'

module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV)

  let plugins = inProduction ? ['transform-remove-console'] : []

  plugins = [
    ...plugins,

    // Disable compiler to fix mobile theme issues and media queries
    // process.env.NODE_ENV === 'test'
    //   ? null
    //   : [
    //       '@tamagui/babel-plugin',
    //       {
    //         components: ['ui'],
    //         // experimentalFlattenThemesOnNative: true,
    //         config: '../../packages/ui/src/tamagui.config.ts',
    //       },
    //     ],

    [
      'module-resolver',
      {
        alias: {
          src: './src',
        },
      },
    ],
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
    'transform-inline-environment-variables',
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
  ].filter(Boolean)

  return {
    ignore: [
      // speeds up compile
      '**/@tamagui/**/dist/**',
    ],
    presets: ['babel-preset-expo'],
    plugins,
  }
}
