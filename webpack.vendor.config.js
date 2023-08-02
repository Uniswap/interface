/* eslint-env node */
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const { DllPlugin } = require('webpack')

const reactLibs = ['react', 'react-dom']
const ethersLibs = [
  'abi',
  'abstract-provider',
  'abstract-signer',
  'address',
  'bignumber',
  'bytes',
  'constants',
  'contracts',
  'hash',
  'hdnode',
  'json-wallets',
  'logger',
  'networks',
  'properties',
  'providers',
  'rlp',
  'signing-key',
  'strings',
  'transactions',
  'wallet',
  'web',
  'wordlists',
].map((lib) => `@ethersproject/${lib}`)
const uniswapLibs = [
  'permit2-sdk',
  'redux-multicall',
  'router-sdk',
  'sdk-core',
  'universal-router-sdk',
  'v2-sdk',
  'v3-sdk',
].map((lib) => `@uniswap/${lib}`)
const libs = [...reactLibs, ...ethersLibs, ...uniswapLibs, 'lodash', '@apollo/client', '@coinbase/wallet-sdk']

module.exports = {
  mode: 'production',
  entry: { vendor: libs },
  plugins: [
    new DllPlugin({
      context: __dirname,
      name: '[name].[fullhash].js',
      path: path.resolve(__dirname, 'vendor/manifest.json'),
    }),
  ],
  output: {
    filename: '[name].[fullhash].js',
    path: path.resolve(__dirname, 'vendor'),
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.swcMinify,
        parallel: require('os').cpus().length,
      }),
    ],
  },
}
