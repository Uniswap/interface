import { ChainId } from "@taraswap/sdk-core";

/* eslint-env node */
require("dotenv").config();

module.exports = {
  forks,
  networks: {
    hardhat: {
      loggingEnabled: !process.env.CI,
      chainId: ChainId.TARAXA,
      accounts: {
        count: 2,
      },
      mining: {
        auto: true, // automine to make tests easier to write.
        interval: 0, // do not interval mine so that tests remain deterministic
      },
    },
  },
};
