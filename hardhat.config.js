/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://eth-mainnet.alchemyapi.io/v2/4mzaIhuVL595M3biVsJB3ymCL4-tYS0N'
      }
    }
  }
};
