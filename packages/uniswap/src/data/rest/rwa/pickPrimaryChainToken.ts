import type { ChainToken } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/** First chain token on an enabled chain. Callers pass chainTokens already sorted mainnet-first (see the RWA
 *  mappers), so this resolves to the mainnet-preferred enabled chain. */
export function pickPrimaryChainToken(
  chainTokens: ChainToken[],
  enabledChainIds: readonly UniverseChainId[],
): ChainToken | undefined {
  const enabled = new Set(enabledChainIds)
  return chainTokens.find((chainToken) => enabled.has(chainToken.chainId as UniverseChainId))
}
