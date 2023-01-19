require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

const accounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
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

    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts,
      chainId: 1,
      live: true,
      saveDeployments: true,
      gasPrice: 35 * 1000000000,
    },


    goerli: {
      chainId: 5,
      url: "https://goerli.infura.io/v3/309820d3955640ec9cda472d998479ef",
      accounts,
      live: true,
      saveDeployments: true,
      gasPrice: 35 * 1000000000,
    },
  },
}
