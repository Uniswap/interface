/* eslint-disable @typescript-eslint/no-var-requires */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  babel: {
    plugins: ['@vanilla-extract/babel-plugin'],
  },
  webpack: {
    plugins: [new VanillaExtractPlugin()],
    configure: (webpackConfig) => {
      const instanceOfMiniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin instanceof MiniCssExtractPlugin
      )
      if (instanceOfMiniCssExtractPlugin !== undefined) instanceOfMiniCssExtractPlugin.options.ignoreOrder = true
      return webpackConfig
    },
  },
}
