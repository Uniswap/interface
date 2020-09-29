import MULTICALL_ABI from './abi.json'

const { ChainID } = require("@harmony-js/utils");

const MULTICALL_NETWORKS: { [chainId in typeof ChainID]: string } = {
  [ChainID.HmyMainnet]: '0xF0A72397FfC17158F82b8C115e0e0987cb499fEb', // Deployed 2020-08-31 16:44:00 UTC
  [ChainID.HmyTestnet]: '0x804e5f2d7d1c204b27466db87922b5fc57666344', // Deployed 2020-08-31 16:41:00 UTC
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
