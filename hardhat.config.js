/* eslint-env node */
require('dotenv').config()

const mainnetFork = {
  url: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  blockNumber: 17023328,
  httpHeaders: {
    Origin: 'localhost:8545',
  },
}

module.exports = {
  networks: {
    hardhat: {
      chainId: 1,
      forking: mainnetFork,
      accounts: {
        count: 1,
      },
    },
  },
}
