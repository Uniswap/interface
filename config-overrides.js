const rewireStyledComponents = require('react-app-rewire-styled-components')

/* config-overrides.js */
module.exports = function override(config, env) {
  config = rewireStyledComponents(config, env)

  config.optimization = {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](ethers|@ethersproject)[\\/]/,
          name: 'ethers',
          chunks: 'all'
        }
      }
    }
  }

  return config
}
