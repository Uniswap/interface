import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'

/**
 * Chains not yet supported by the centralized price service backend.
 * Tokens on these chains fall back to the legacy GraphQL price path.
 */
const UNSUPPORTED_PRICE_SERVICE_CHAINS: ReadonlySet<number> = new Set([
  UniverseChainId.WorldChain,
  UniverseChainId.XLayer,
  UniverseChainId.Celo,
])

export function isPriceServiceSupportedChain(chainId: number): boolean {
  return !isSVMChain(chainId) && !UNSUPPORTED_PRICE_SERVICE_CHAINS.has(chainId)
}
