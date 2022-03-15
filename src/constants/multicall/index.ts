import { ChainId } from '@celo-tools/use-contractkit'

import MULTICALL_ABI from './abi.json'

const MULTICALL_NETWORKS: Record<ChainId, string> = {
  [ChainId.CeloMainnet]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.Alfajores]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.Baklava]: '0x75f59534dd892c1f8a7b172d639fa854d529ada3',
  [ChainId.EthereumMainnet]: '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  [ChainId.Kovan]: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
}

export { MULTICALL_ABI, MULTICALL_NETWORKS }
