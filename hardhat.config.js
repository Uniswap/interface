/* eslint-env node */
require('dotenv').config()

// Block selection is arbitrary, as e2e tests will build up their own state.
// The only requirement is that all infrastructure under test (eg Permit2 contracts) are already deployed.
// TODO(WEB-2187): Make more dynamic to avoid manually updating
const BLOCK_NUMBER = 17388567

const mainnetFork = {
  url: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  blockNumber: BLOCK_NUMBER,
  httpHeaders: {
    Origin: 'localhost:3000', // infura allowlists requests by origin
  },
}

module.exports = {
  networks: {
    hardhat: {
      chainId: 1,
      forking: mainnetFork,
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
