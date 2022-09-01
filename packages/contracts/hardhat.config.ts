import "@nomiclabs/hardhat-waffle"
import "@openzeppelin/hardhat-upgrades"
import "@openzeppelin/hardhat-defender"
import "@nomiclabs/hardhat-ethers"
import "@typechain/hardhat"
import "hardhat-gas-reporter"
import "hardhat-contract-sizer"
import "hardhat-abi-exporter"
import "./tasks/swap"
import "./tasks/upgrade"
require('dotenv').config()

module.exports = {
    defaultNetwork: 'hardhat',
    defender: {
        apiKey: "[apiKey]",
        apiSecret: "[apiSecret]",
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        qaNew: {
            url: 'http://10.41.20.51:8545',
            gasPrice: 5000000000,
            chainId: 7001,
            gas: 4100000,
            accounts:['6395A7C842A08515961888D21D72F409B61FBCE96AF1E520384E375F301A8297']
        },
        arbitrum: {
            url: 'https://rinkeby.arbitrum.io/rpc',
            gasPrice: 200000000,
            chainId: 421611,
            gas: 5000000,
            // accounts:['96e8e32341ce890aff8b46066f7b77a6d2ab2115a24c365e9de1fbed49e04837']
            accounts: [process.env.PRI_KEY]
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
        },
        teleport: {
            url: 'https://teleport-localvalidator.qa.davionlabs.com/',
            gasPrice: 5000000000,
            chainId: 7001,
            gas: 4100000,
            // accounts:['24ad33fb88a6c2347ec90178c881969e59571c6ad8cc0f597e7c7d87354df3f8']
            //usdt
            //accounts:['96e8e32341ce890aff8b46066f7b77a6d2ab2115a24c365e9de1fbed49e04837']
            //qa 发钱test net admin私钥
            //accounts:['2307796387358a2a99fbbb88312dc6516ed7ab02bd8f04cc44019e4818560157']
            accounts: [process.env.PRI_KEY]
        },
        rinkeby: {
            url: 'https://rinkeby.infura.io/v3/023f2af0f670457d9c4ea9cb524f0810',
            gasPrice: 1500000000,
            chainId: 4,
            gas: 5000000,
            accounts: [process.env.PRI_KEY]
            //accounts:['0x7eefd641410560e690736ee331bd32512c9b58419a877eff2189facbef33cd1e']
            //accounts:['8f14df1da1a318bec99800b72c5031e4fdc4ec017f00ab9659339ecb0193120e']
        },
        bsctest: {
            url: 'https://data-seed-prebsc-2-s1.binance.org:8545',
            gasPrice: 10000000000,
            chainId: 97,
            gas: 5000000,
            //admin adder
            // accounts:['96e8e32341ce890aff8b46066f7b77a6d2ab2115a24c365e9de1fbed49e04837']
            //accounts:['8f14df1da1a318bec99800b72c5031e4fdc4ec017f00ab9659339ecb0193120e']
            accounts: [process.env.PRI_KEY]
        },
        opg: { // Optimism Goerli
            url: "https://goerli.optimism.io",
            accounts: [process.env.PRI_KEY],
            chainId: 420,
            gas: 10000000,
            gasPrice: 5000000,
            //explorer: https://blockscout.com/optimism/goerli/
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.6.6',
            },
            {
                version: '0.6.12',
            }
        ],
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        }
    },
    gasReporter: {
        enabled: true,
        showMethodSig: true,
        maxMethodDiff: 10,
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
    },
    abiExporter: {
        path: './build',
        runOnCompile: true,
        clear: true,
        flat: true,
        except: ['@openzeppelin/contracts'],
        spacing: 2
        // pretty: true,
    }
}