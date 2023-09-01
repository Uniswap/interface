import { ChainId } from '@kinetix/sdk-core'

/* eslint-env node */
require('dotenv').config()

module.exports = {
  networks: {
    hardhat: {
      chainId: ChainId.KAVA,
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
