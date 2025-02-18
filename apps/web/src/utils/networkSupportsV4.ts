import { UniverseChainId } from 'uniswap/src/features/chains/types'

const V4_UNSUPPORTED_CHAIN_IDS = [UniverseChainId.Zksync, UniverseChainId.Celo]

export function isV4UnsupportedChain(chainId?: number) {
  if (!chainId) {
    return false
  }
  return V4_UNSUPPORTED_CHAIN_IDS.includes(chainId)
}
