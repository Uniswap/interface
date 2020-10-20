import MULTICALL_ABI from './abi.json'

const { ChainID } = require("@harmony-js/utils");

const MULTICALL_NETWORKS: { [chainId in typeof ChainID]: string } = {
  [ChainID.HmyMainnet]: '0xFE4980f62D708c2A84D3929859Ea226340759320', // Deployed 2020-10-20 10:56:00 UTC
  [ChainID.HmyTestnet]: '0xbcd3451992B923531615293Cb2b2c38ba8DE9529', // Deployed 2020-10-20 10:56:00 UTC
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
