require("@nomicfoundation/hardhat-toolbox");
require('hardhat-deploy')
require("solidity-coverage")
require("hardhat-deploy")
require("hardhat-deploy-ethers")

/** @type import('hardhat/config').HardhatUserConfig */

const accounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test wheel",
}
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ]
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  },

  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ["local"],
    },

    hardhat: {
      live: false,
      saveDeployments: true,
      tags: ["test", "local"],
    },

    goerli: {
      chainId: 5,
      url: "https://endpoints.omniatech.io/v1/eth/goerli/public",
      accounts,
      live: true,
      saveDeployments: true,
    },
  },
}
