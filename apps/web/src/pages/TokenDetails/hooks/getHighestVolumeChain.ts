import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { TokenQueryData } from '~/appGraphql/data/Token'

type ProjectTokens = NonNullable<NonNullable<NonNullable<TokenQueryData>['project']>['tokens']>

/** Returns the multichain entry whose chain has the highest 24h volume, or undefined when data is unavailable. */
export function getHighestVolumeChain(
  tokens: ProjectTokens | undefined,
  multichainEntries: MultichainTokenEntry[],
): MultichainTokenEntry | undefined {
  if (!tokens?.length || !multichainEntries.length) {
    return undefined
  }

  // Build a map of GraphQL chain → volume
  const volumeByChain = new Map<string, number>()
  for (const token of tokens) {
    const volume = token.market?.volume24H?.value
    if (volume !== undefined && volume > 0) {
      volumeByChain.set(token.chain, volume)
    }
  }

  if (volumeByChain.size === 0) {
    return undefined
  }

  let bestEntry: MultichainTokenEntry | undefined
  let bestVolume = 0

  for (const entry of multichainEntries) {
    const gqlChain = getChainInfo(entry.chainId).backendChain.chain
    const volume = volumeByChain.get(gqlChain) ?? 0
    if (volume > bestVolume) {
      bestVolume = volume
      bestEntry = entry
    }
  }

  return bestEntry
}
