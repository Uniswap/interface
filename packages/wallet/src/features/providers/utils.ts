import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, UniverseChainId } from 'uniswap/src/types/chains'

export function isPrivateRpcSupportedOnChain(chainId: UniverseChainId): boolean {
  return Boolean(UNIVERSE_CHAIN_INFO[chainId]?.rpcUrls?.[RPCType.Private])
}
