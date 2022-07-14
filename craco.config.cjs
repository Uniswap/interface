/* eslint-disable @typescript-eslint/no-var-requires */
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  babel: {
    plugins: ['@vanilla-extract/babel-plugin'],
  },
  webpack: {
    plugins: [new VanillaExtractPlugin()],
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        const instanceOfMiniCssExtractPlugin = webpackConfig.plugins.find(
          (plugin) => plugin instanceof MiniCssExtractPlugin
        )
        instanceOfMiniCssExtractPlugin.options.ignoreOrder = true
      }
      return webpackConfig
    },
  },
}
