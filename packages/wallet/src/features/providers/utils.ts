import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { RPCType, WalletChainId } from 'uniswap/src/types/chains'

export function isPrivateRpcSupportedOnChain(chainId: WalletChainId): boolean {
  return Boolean(UNIVERSE_CHAIN_INFO[chainId]?.rpcUrls?.[RPCType.Private])
}
