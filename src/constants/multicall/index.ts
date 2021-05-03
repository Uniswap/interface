import { ChainId } from '@ubeswap/sdk'

import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.ALFAJORES]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.BAKLAVA]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
