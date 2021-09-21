module.exports = {
  webpack: {
    configure(webpackConfig) {
      webpackConfig.optimization.splitChunks = {
        chunks: 'initial',
        name: false,
        cacheGroups: {
          web3: {
            test: /[\\/]node_modules[\\/]((@ethersproject)|(@uniswap)|(@web3)|(eth))/,
            name: 'web3',
            priority: 10,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            reuseExistingChunk: true,
          },
        },
      }
      return webpackConfig
    },
  },
}
