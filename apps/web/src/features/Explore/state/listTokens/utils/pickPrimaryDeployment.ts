import type { ChainTokenRankStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TimePeriod } from '~/appGraphql/data/util'
import { sortChainStatsByVolume } from '~/features/Explore/state/listTokens/utils/multichainVolume'

/**
 * Picks the (chainId, address) deployment to link/display for a multichain token row: the one
 * matching `exploreChainId` when set (e.g. explore page network filter, so TDP opens on that
 * network); otherwise the deployment with the most 1d volume (stable across the table's
 * selectable time-period filter, so the row's link/logo doesn't change as the user toggles
 * 1H/1D/7D), falling back to the first `addresses` entry when no chain has volume data.
 *
 * Note: unlike v1's `chainTokens` array (whose order the backend controlled), v2's `addresses`
 * is a `map<string,string>` — JS always iterates integer-like string keys in ascending numeric
 * order regardless of insertion order, so without a volume-based pick, "first entry" would mean
 * lowest chainId, not necessarily whatever the backend considers the canonical/primary chain.
 */
export function pickPrimaryDeployment({
  addresses,
  exploreChainId,
  chainStats = [],
}: {
  addresses: Record<string, string>
  exploreChainId: UniverseChainId | undefined
  chainStats?: readonly ChainTokenRankStats[]
}): { chainId: number; address: string } | undefined {
  const entries = Object.entries(addresses)
  if (entries.length === 0) {
    return undefined
  }
  if (exploreChainId !== undefined) {
    const match = entries.find(([chainIdStr]) => Number(chainIdStr) === exploreChainId)
    return match ? { chainId: Number(match[0]), address: match[1] } : undefined
  }
  const byVolume = sortChainStatsByVolume(chainStats, TimePeriod.DAY).find((cs) => addresses[String(cs.chainId)])
  if (byVolume) {
    return { chainId: byVolume.chainId, address: addresses[String(byVolume.chainId)]! }
  }
  const [chainIdStr, address] = entries[0]!
  return { chainId: Number(chainIdStr), address }
}
