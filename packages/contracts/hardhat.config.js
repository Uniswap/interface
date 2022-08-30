require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades')
require('hardhat-abi-exporter');
require('./tasks/upgrade')


module.exports = {
    solidity: {
        compilers: [{
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
        }]
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
        g:{ // Goerli
            url: "https://goerli.infura.io/v3/5d207effd0bb4c718cee75a49dbddfee",
            accounts: [process.env.PRI_KEY],
            chainId: 5
            //explorer: https://goerli.etherscan.io
        }
    },
    abiExporter: {
        path: './abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2
        // pretty: true,
    }
};
