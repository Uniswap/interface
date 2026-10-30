import type {
  ChainTokenRankStats,
  RankedMultichainToken,
  TokenRankStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { getRestMultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/getMultichainTokenEntry'
import { pickPrimaryDeployment } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { TimePeriod } from '~/data/util'

type VolumeKey = 'volume1h' | 'volume1d' | 'volume7d' | 'volume30d' | 'volume1y' | 'volumeAll'

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
      return stats.volume1y ?? stats.volume1d
    case TimePeriod.MAX:
      return stats.volumeAll ?? stats.volume1d
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
  [TimePeriod.MAX]: 'volumeAll',
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
 * The registry + rollout-flag filtered network set for a ranked token, via the shared TDP gate
 * (getRestMultichainTokenEntry against the feature-flagged chain ids). Single source of truth:
 * row existence, the "N networks" count, the multichain hover affordance, the TDP link mode,
 * and rank numbering must all gate on this same set.
 */
export function getAllowedAddressChainIds(
  rankedToken: RankedMultichainToken,
  allowedChainIds: readonly UniverseChainId[],
): Set<UniverseChainId> {
  const result = new Set<UniverseChainId>()
  for (const [chainIdKey, address] of Object.entries(rankedToken.multichainToken?.addresses ?? {})) {
    const entry = getRestMultichainTokenEntry({ chainIdKey, address }, allowedChainIds)
    if (entry) {
      result.add(entry.chainId)
    }
  }
  return result
}

/**
 * Returns the token's networks: volume-sorted (descending, for the given time period) where
 * per-chain stats exist, then any remaining networks from the addresses map (chains where the
 * token exists but has no published stats yet, e.g. ETH on a freshly supported chain).
 *
 * The full list is exactly the set of addresses keys the TDP network dropdown renders: each
 * entry passes through getRestMultichainTokenEntry against `allowedChainIds` (the feature-flagged
 * chain ids, same gate as the TDP's useMultichainTokenEntries), so unknown or flag-disabled
 * chains never inflate the Explore "N networks" count above what the TDP shows. chainStats alone
 * under-counts by design (the backend deliberately omits stats-less chains from it), and a
 * chainStats entry for a chain absent from addresses is excluded rather than over-counting.
 */
export function getChainIdsByVolume({
  rankedToken,
  timePeriod,
  allowedChainIds,
}: {
  rankedToken: RankedMultichainToken | undefined
  timePeriod: TimePeriod
  allowedChainIds: readonly UniverseChainId[]
}): UniverseChainId[] | undefined {
  if (!rankedToken) {
    return undefined
  }
  const addressChainIds = getAllowedAddressChainIds(rankedToken, allowedChainIds)
  // Built incrementally so byVolume also dedupes duplicate chainStats entries for one chain
  // (malformed data) rather than only guarding the appended stats-less ids.
  const seen = new Set<UniverseChainId>()
  const byVolume = sortChainStatsByVolume(rankedToken.chainStats, timePeriod)
    .map((cs) => cs.chainId)
    .filter((id): id is UniverseChainId => {
      if (!isUniverseChainId(id) || !addressChainIds.has(id) || seen.has(id)) {
        return false
      }
      seen.add(id)
      return true
    })
  const statslessNetworks = [...addressChainIds].filter((id) => !seen.has(id)).sort((a, b) => a - b)
  return [...byVolume, ...statslessNetworks]
}

/**
 * Picks the primary deployment for a ranked token, constrained to the allowed chain ids.
 * The primary deployment is the canonical chain if it is allowed, otherwise the lowest
 * allowed chain id. Returns undefined if no allowed deployments exist.
 */
export function pickAllowedPrimaryDeployment({
  rankedToken,
  chainId,
  allowedChainIds,
}: {
  rankedToken: RankedMultichainToken
  chainId: UniverseChainId | undefined
  allowedChainIds: UniverseChainId[]
}): { chainId: number; address: string } | undefined {
  const allowed = getAllowedAddressChainIds(rankedToken, allowedChainIds)
  const addresses = Object.fromEntries(
    Object.entries(rankedToken.multichainToken?.addresses ?? {}).filter(([chainIdKey]) =>
      allowed.has(Number(chainIdKey) as UniverseChainId),
    ),
  )
  const deploymentOn = (id: number): { chainId: number; address: string } | undefined =>
    pickPrimaryDeployment({ addresses, chainId: id })

  if (chainId !== undefined) {
    return deploymentOn(chainId)
  }
  const canonicalChainId = rankedToken.multichainToken?.canonicalChainId
  const canonical = canonicalChainId ? deploymentOn(canonicalChainId) : undefined
  if (canonical) {
    return canonical
  }
  return allowed.size > 0 ? deploymentOn(Math.min(...allowed)) : undefined
}
