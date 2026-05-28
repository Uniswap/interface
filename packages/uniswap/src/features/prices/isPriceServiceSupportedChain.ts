import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'

/**
 * Explicit per-chain price service support map.
 * TypeScript enforces that every UniverseChainId has an entry.
 *
 * When adding a new chain, you MUST add it here:
 *  - `true`  → chain is supported by the centralized price service backend
 *  - `false` → chain falls back to the legacy GraphQL price path
 *
 * New chains should default to `false` until backend support is confirmed.
 */
const PRICE_SERVICE_SUPPORT: Record<UniverseChainId, boolean> = {
  // Supported
  [UniverseChainId.Mainnet]: true,
  [UniverseChainId.ArbitrumOne]: true,
  [UniverseChainId.Avalanche]: true,
  [UniverseChainId.Base]: true,
  [UniverseChainId.Blast]: true,
  [UniverseChainId.Bnb]: true,
  [UniverseChainId.Monad]: true,
  [UniverseChainId.Optimism]: true,
  [UniverseChainId.Polygon]: true,
  [UniverseChainId.Soneium]: true,
  [UniverseChainId.Unichain]: true,
  [UniverseChainId.Zksync]: true,
  [UniverseChainId.Zora]: true,

  // Testnets
  [UniverseChainId.Sepolia]: true,
  [UniverseChainId.UnichainSepolia]: true,

  // Unsupported — falls back to legacy (TAPI /quote or GraphQL)
  [UniverseChainId.Celo]: false,
  [UniverseChainId.Linea]: false,
  [UniverseChainId.Tempo]: false,
  [UniverseChainId.WorldChain]: false,
  [UniverseChainId.XLayer]: false,

  // SVM — excluded by isSVMChain() but listed for exhaustiveness
  [UniverseChainId.Solana]: false,
}

export function isPriceServiceSupportedChain(chainId: number): boolean {
  return !isSVMChain(chainId) && PRICE_SERVICE_SUPPORT[chainId as UniverseChainId] === true
}
