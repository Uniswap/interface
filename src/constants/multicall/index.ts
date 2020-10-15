import MULTICALL_ABI from './abi.json'

const { ChainID } = require("@harmony-js/utils");

const MULTICALL_NETWORKS: { [chainId in typeof ChainID]: string } = {
  [ChainID.HmyMainnet]: '0xF0A72397FfC17158F82b8C115e0e0987cb499fEb', // Deployed 2020-08-31 16:44:00 UTC
  [ChainID.HmyTestnet]: '0x309e12a7647f944b6599e102dc4070ac7b52c0f1', // Deployed 2020-10-01 23:16:00 UTC
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
