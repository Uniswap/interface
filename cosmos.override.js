// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require('html-webpack-plugin')

// Renders the cosmos fixtures in isolation, instead of using public/index.html.
module.exports = (webpackConfig) => ({
  ...webpackConfig,
  plugins: webpackConfig.plugins.map((plugin) =>
    plugin instanceof HtmlWebpackPlugin
      ? new HtmlWebpackPlugin({
          templateContent: '<body></body>',
        })
      : plugin
  ),
})
