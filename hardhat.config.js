import { SupportedChainId } from '@uniswap/sdk-core'

/* eslint-env node */
require('dotenv').config()

// Block selection is arbitrary, as e2e tests will build up their own state.
// The only requirement is that all infrastructure under test (eg Permit2 contracts) are already deployed.
// TODO(WEB-2187): Make more dynamic to avoid manually updating
const BLOCK_NUMBER = 17388567
const POLYGON_BLOCK_NUMBER = 43600000

const forkingConfig = {
  httpHeaders: {
    Origin: 'localhost:3000', // infura allowlists requests by origin
  },
}

const forks = {
  [SupportedChainId.MAINNET]: {
    url: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    blockNumber: BLOCK_NUMBER,
    ...forkingConfig,
  },
  [SupportedChainId.POLYGON]: {
    url: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    blockNumber: POLYGON_BLOCK_NUMBER,
    ...forkingConfig,
  },
}

module.exports = {
  forks,
  networks: {
    hardhat: {
      chainId: SupportedChainId.MAINNET,
      forking: forks[SupportedChainId.MAINNET],
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
