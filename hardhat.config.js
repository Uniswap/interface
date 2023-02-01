/* eslint-env node */
require('@nomiclabs/hardhat-ethers')
require('@nomicfoundation/hardhat-toolbox')

module.exports = {
  solidity: '0.8.17',
  // networks: {
  //   hardhat: {
  //     forking: {
  //       url: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  //       blockNumber: 14390000,
  //     },
  //   },
  // },
  paths: {
    tests: './cypress',
  },
}
