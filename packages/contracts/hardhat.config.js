require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades')
require('hardhat-abi-exporter');
require('./tasks/upgrade')
require('./tasks/call')


module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.4.17",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.6.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }],
        overrides: {
            "contracts/spirit-v2-farming/Bribes.sol": {
                version: "0.8.11",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                }
              },
              "contracts/spirit-v2-farming/VariableGaugeProxy.sol": {
                version: "0.8.11",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                }
              },
              "contracts/spirit-v2-farming/StableGaugeProxy.sol": {
                version: "0.8.11",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                }
              },
              "contracts/spirit-v2-farming/AdminGaugeProxy.sol": {
                version: "0.8.11",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                }
              },
              "contracts/spirit-v2-farming/utils.sol": {
                version: "0.8.11",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                }
              },
        }
    },
    defaultNetwork: "hardhat",
    networks: {
        opg: { // Optimism Goerli
            url: "https://goerli.optimism.io/",
            accounts: [process.env.PRI_KEY],
            chainId: 420
            //explorer: https://blockscout.com/optimism/goerli/
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: [process.env.PRI_KEY]
        },
        g: { // Goerli
            url: "https://goerli.infura.io/v3/5d207effd0bb4c718cee75a49dbddfee",
            accounts: [process.env.PRI_KEY],
            chainId: 5
            //explorer: https://goerli.etherscan.io
        }
    },
    abiExporter: {
        path: './build',
        runOnCompile: true,
        clear: true,
        flat: true,
        except: ['@openzeppelin/contracts', 'contracts/spirit-v2-farming/utils.sol'],
        spacing: 2
        // pretty: true,
    }
};
