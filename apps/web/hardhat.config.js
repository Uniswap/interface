import { ChainId } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_CREATION_BLOCK } from '@uniswap/universal-router-sdk'

/* eslint-env node */
require('dotenv').config()

const forkingConfig = {
  httpHeaders: {
    Origin: 'localhost:3000', // infura allowlists requests by origin
  },
}

const forks = {
  [ChainId.MAINNET]: {
    url: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ...forkingConfig,
  },
  [ChainId.POLYGON]: {
    url: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    blockNumber: UNIVERSAL_ROUTER_CREATION_BLOCK(ChainId.POLYGON),
    ...forkingConfig,
  },
}

module.exports = {
  forks,
  networks: {
    hardhat: {
      chainId: ChainId.MAINNET,
      forking: forks[ChainId.MAINNET],
      accounts: {
        count: 2,
      },
      mining: {
        auto: true, // automine to make tests easier to write.
        interval: 0, // do not interval mine so that tests remain deterministic
      },
    },
  },
}
