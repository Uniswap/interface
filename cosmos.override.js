/* eslint-disable @typescript-eslint/no-var-requires */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')

// Renders the cosmos fixtures in isolation, instead of using public/index.html.
module.exports = (webpackConfig) => ({
  ...webpackConfig,
  plugins: webpackConfig.plugins.map((plugin) => {
    if (plugin instanceof HtmlWebpackPlugin) {
      return new HtmlWebpackPlugin({
        templateContent: '<body></body>',
      })
    }
    if (plugin instanceof DefinePlugin) {
      return new DefinePlugin({
        ...plugin.definitions,
        'process.env': {
          ...plugin.definitions['process.env'],
          REACT_APP_IS_WIDGET: true,
          REACT_APP_LOCALES: "'../locales'",
        },
      })
    }
    return plugin
  }),
})
