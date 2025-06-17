import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'

export function isPrivateRpcSupportedOnChain(chainId: UniverseChainId): boolean {
  return Boolean(getChainInfo(chainId).rpcUrls[RPCType.Private])
}
