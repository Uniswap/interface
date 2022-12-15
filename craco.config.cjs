/* eslint-disable @typescript-eslint/no-var-requires */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { DefinePlugin } = require('webpack')

const commitHash = require('child_process').execSync('git rev-parse HEAD')

module.exports = {
  babel: {
    plugins: ['@vanilla-extract/babel-plugin'],
  },
  webpack: {
    plugins: [
      new VanillaExtractPlugin(),
      new DefinePlugin({
        'process.env.REACT_APP_GIT_COMMIT_HASH': JSON.stringify(commitHash.toString()),
      }),
    ],
    configure: (webpackConfig) => {
      const instanceOfMiniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin instanceof MiniCssExtractPlugin
      )
      if (instanceOfMiniCssExtractPlugin !== undefined) instanceOfMiniCssExtractPlugin.options.ignoreOrder = true

      // We're currently on Webpack 4.x that doesn't support the `exports` field in package.json.
      // See https://github.com/webpack/webpack/issues/9509.
      //
      // In case you need to add more modules, make sure to remap them to the correct path.
      //
      // Map @uniswap/conedison to its dist folder.
      // This is required because conedison uses * to redirect all imports to its dist.
      webpackConfig.resolve.alias['@uniswap/conedison'] = '@uniswap/conedison/dist'

      return webpackConfig
    },
  },
}
