/**
 * Hardhat config to fork mainnet at a specific block.
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-mainnet.alchemyapi.io/v2/lhVWQ3rY2i5_OZtYkU4Lzg_OsDT97Eoz',
        blockNumber: 13582625,
      },
    },
  },
}
