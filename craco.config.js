module.exports = {
  webpack: {
    configure(webpackConfig) {
      const { splitChunks } = webpackConfig.optimization
      splitChunks.cacheGroups = {
        ethers: {
          test: /[\\/]node_modules[\\/]((@ethersproject)|(eth))/,
          chunks: 'all',
        },
        filename: '[name].bundle.js',
      }

      return webpackConfig
    },
  },
}
