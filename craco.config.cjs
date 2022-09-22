/* eslint-disable @typescript-eslint/no-var-requires */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

const commitHash = require('child_process').execSync('git rev-parse --short HEAD')

module.exports = {
  babel: {
    plugins: ['@vanilla-extract/babel-plugin'],
  },
  webpack: {
    plugins: [
      new VanillaExtractPlugin(),
      new webpack.DefinePlugin({
        GIT_COMMIT_HASH: JSON.stringify(commitHash),
      }),
    ],
    configure: (webpackConfig) => {
      const instanceOfMiniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin instanceof MiniCssExtractPlugin
      )
      if (instanceOfMiniCssExtractPlugin !== undefined) instanceOfMiniCssExtractPlugin.options.ignoreOrder = true
      return webpackConfig
    },
  },
}
