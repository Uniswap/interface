const rewireStyledComponents = require('react-app-rewire-styled-components')
const CompressionPlugin = require("compression-webpack-plugin");

/* config-overrides.js */
module.exports = function override(config, env) {
  config = rewireStyledComponents(config, env)

  config.optimization = {
    ...config.optimization,
    moduleIds: 'named',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](ethers|@ethersproject)[\\/]/,
          name: 'ethers',
          chunks: 'all'
        },
        commons: {
          test: /[\\/]node_modules[\\/]/,
          // cacheGroupKey here is `commons` as the key of the cacheGroup
          name(module, chunks, cacheGroupKey) {
            const moduleFileName = module
              .identifier()
              .split('/')
              .reduceRight((item) => item);
            const allChunksNames = chunks.map((item) => item.name).join('~');
            return `${cacheGroupKey}-${allChunksNames}-${moduleFileName}`;
          },
          chunks: 'all',
        },
      }
    }
  }

  return {
    ...config,
    plugins: [
      ...config.plugins,
      new CompressionPlugin()
    ]
  }
}
