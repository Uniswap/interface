const { ALCHEMY_API_KEY } = require('react-native-dotenv')

const mainnetFork = {
  url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
  blockNumber: 13582625,
}

/**
 * Hardhat config to fork mainnet at a specific block.
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1,
      forking: mainnetFork,
    },
  },
}
