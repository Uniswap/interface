/* eslint-env node */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const { execSync } = require('child_process')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { DefinePlugin } = require('webpack')

const commitHash = execSync('git rev-parse HEAD').toString().trim()
const isProduction = process.env.NODE_ENV === 'production'

// Linting and type checking are only necessary as part of development and testing.
// Omit them from production builds, as they slow down the feedback loop.
const shouldLintOrTypeCheck = !isProduction

module.exports = {
  babel: {
    plugins: ['@vanilla-extract/babel-plugin'],
    env: {
      test: {
        plugins: ['istanbul'],
      },
      development: {
        plugins: ['istanbul'],
      },
    },
  },
  eslint: {
    enable: shouldLintOrTypeCheck,
    pluginOptions(eslintConfig) {
      return Object.assign(eslintConfig, {
        cache: true,
        cacheLocation: 'node_modules/.cache/eslint/',
      })
    },
  },
  typescript: {
    enableTypeChecking: shouldLintOrTypeCheck,
  },
  jest: {
    configure(jestConfig) {
      return Object.assign(jestConfig, {
        cacheDirectory: 'node_modules/.cache/jest',
        transformIgnorePatterns: ['@uniswap/conedison/format', '@uniswap/conedison/provider'],
        moduleNameMapper: {
          '@uniswap/conedison/format': '@uniswap/conedison/dist/format',
          '@uniswap/conedison/provider': '@uniswap/conedison/dist/provider',
        },
      })
    },
  },
  webpack: {
    plugins: [new VanillaExtractPlugin({ identifiers: 'short' })],
    configure: (webpackConfig) => {
      webpackConfig.plugins = webpackConfig.plugins.map((plugin) => {
        // Extend process.env with dynamic values (eg commit hash).
        // This will make dynamic values available to JavaScript only, not to interpolated HTML (ie index.html).
        if (plugin instanceof DefinePlugin) {
          Object.assign(plugin.definitions['process.env'], {
            REACT_APP_GIT_COMMIT_HASH: JSON.stringify(commitHash),
          })
        }

        // CSS ordering is mitigated through scoping / naming conventions, so we can ignore order warnings.
        // See https://webpack.js.org/plugins/mini-css-extract-plugin/#remove-order-warnings.
        if (plugin instanceof MiniCssExtractPlugin) {
          plugin.options.ignoreOrder = true
        }

        return plugin
      })

      // We're currently on Webpack 4.x which doesn't support the `exports` field in package.json.
      // Instead, we need to manually map the import path to the correct exports path (eg dist or build folder).
      // See https://github.com/webpack/webpack/issues/9509.
      webpackConfig.resolve.alias['@uniswap/conedison'] = '@uniswap/conedison/dist'

      return webpackConfig
    },
  },
}
