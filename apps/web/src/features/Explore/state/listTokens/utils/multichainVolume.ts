import type {
  ChainTokenRankStats,
  RankedMultichainToken,
  TokenRankStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TimePeriod } from '~/appGraphql/data/util'

type VolumeKey = 'volume1h' | 'volume1d' | 'volume7d' | 'volume30d' | 'volume1y'

/** Returns the volume value for the given time period, or volume1d as fallback (e.g. legacy path only has volume1d). */
export function getVolumeForTimePeriod(stats: TokenRankStats | undefined, timePeriod: TimePeriod): number | undefined {
  if (!stats) {
    return undefined
  }
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return stats.volume1h ?? stats.volume1d
    case TimePeriod.DAY:
      return stats.volume1d
    case TimePeriod.WEEK:
      return stats.volume7d ?? stats.volume1d
    case TimePeriod.MONTH:
      return stats.volume30d ?? stats.volume1d
    case TimePeriod.YEAR:
    case TimePeriod.MAX:
      return stats.volume1y ?? stats.volume1d
    default:
      return stats.volume1d
  }
}

export const TIME_PERIOD_TO_VOLUME_KEY: Record<TimePeriod, VolumeKey> = {
  [TimePeriod.HOUR]: 'volume1h',
  [TimePeriod.DAY]: 'volume1d',
  [TimePeriod.WEEK]: 'volume7d',
  [TimePeriod.MONTH]: 'volume30d',
  [TimePeriod.YEAR]: 'volume1y',
  [TimePeriod.MAX]: 'volume1y',
}

/** Sorts a ranked token's per-chain stats by volume descending for the given time period. */
export function sortChainStatsByVolume(
  chainStats: readonly ChainTokenRankStats[],
  timePeriod: TimePeriod,
): ChainTokenRankStats[] {
  const volumeKey = TIME_PERIOD_TO_VOLUME_KEY[timePeriod]
  return [...chainStats].sort((a, b) => {
    const aVol = a.stats?.[volumeKey] ?? 0
    const bVol = b.stats?.[volumeKey] ?? 0
    return bVol - aVol
  })
}

/**
 * Returns chain IDs for a ranked multichain token sorted by volume descending for the given
 * time period. Chains with no volume for that period are placed at the end.
 */
export function getChainIdsByVolume(
  rankedToken: RankedMultichainToken | undefined,
  timePeriod: TimePeriod,
): UniverseChainId[] | undefined {
  if (!rankedToken) {
    return undefined
  }
  return sortChainStatsByVolume(rankedToken.chainStats, timePeriod).map((cs) => cs.chainId as UniverseChainId)
}
