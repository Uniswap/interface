import { ChainId } from '@uniswap/sdk-core'

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
    ...forkingConfig,
  },
  [ChainId.OPTIMISM]: {
    url: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ...forkingConfig,
  },
}

module.exports = {
  forks,
  networks: {
    hardhat: {
      loggingEnabled: !process.env.CI,
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
