const path = require('path')
module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    'storybook-dark-mode',
    'storybook-addon-apollo-client',
    {
      name: '@storybook/addon-react-native-web',
      options: {
        modulesToTranspile: ['react-native-reanimated'],
        babelPlugins: ['react-native-reanimated/plugin'],
      },
    },
    '@storybook/addon-mdx-gfm',
    'storybook-addon-apollo-client',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '..')]
    function setupSVG() {
      // handle SVG support inside Storybook
      const fileLoaderRule = config.module.rules.find((rule) => rule.test.test('.svg'))
      fileLoaderRule.exclude = /\.svg$/
      config.module.rules.push({
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
          },
        ],
      })
    }

    function setupReactNativeMocks() {
      // This would match almost any react-native module
      config.module.rules.push({
        test: /(@?react-(navigation|native)).*\.(ts|js)x?$/,
        include: /node_modules/,
        exclude: [/react-native-web/, /\.(native|ios|android)\.(ts|js)x?$/],
        loader: 'babel-loader',
      })
    }

    function setupLocalMocks() {
      // Storybook doesn't auto mock __mock__
      const __mocks__ = [
        // TODO: fix mocks for Storybook, and re-enable
        // '@react-native-firebase/app',
        // '@react-native-firebase/firestore',
        // '@react-native-firebase/remote-config',
        '@react-native-masked-view/masked-view', // used by shimmer
        '@shopify/react-native-skia',
        'react-native-permissions',
        'react-native-fast-image',
        'react-native-context-menu-view',
        // add mocks to `__mocks__/${mockName}.ts`, and mockName here
      ]

      __mocks__.forEach((mockName) => {
        config.resolve.alias[mockName] = require.resolve(`../__mocks__/${mockName}.ts`)
      })
    }

    function setupGraphQLQueries() {
      config.module.rules.push({
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      })
    }

    setupSVG()
    setupReactNativeMocks()
    setupLocalMocks()
    setupGraphQLQueries()

    return config
  },
  docs: {
    autodocs: false,
  },
}
