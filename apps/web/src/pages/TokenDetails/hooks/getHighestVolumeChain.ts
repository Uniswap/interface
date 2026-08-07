import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'

/** Returns the multichain entry whose chain has the highest 24h volume, or undefined when data is unavailable. */
export function getHighestVolumeChain(
  volumeByChainId: Partial<Record<number, number>> | undefined,
  multichainEntries: MultichainTokenEntry[],
): MultichainTokenEntry | undefined {
  if (!volumeByChainId || !multichainEntries.length) {
    return undefined
  }

  let bestEntry: MultichainTokenEntry | undefined
  let bestVolume = 0

  for (const entry of multichainEntries) {
    const volume = volumeByChainId[entry.chainId] ?? 0
    if (volume > bestVolume) {
      bestVolume = volume
      bestEntry = entry
    }
  }

  return bestEntry
}
