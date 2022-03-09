import { ChainId } from '@celo-tools/use-contractkit'

import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: Record<ChainId, string> = {
  [ChainId.Mainnet]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.Alfajores]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.Baklava]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
