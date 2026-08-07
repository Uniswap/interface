import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { SparklineMap } from '~/data/types'
import type { PricePoint } from '~/data/util'
import { multichainTokenKey } from '~/features/Explore/state/listTokens/utils/multichainTokenKey'

/**
 * Builds a sparklines map (multichainId -> priceHistory) for the given tokens from the
 * priceHistoryByMultichainId side-channel produced alongside them (see
 * RankedMultichainTokensResult). Filters that side-channel down to the tokens currently on
 * screen (one entry per multichain token; no sparkline data for subrows).
 */
export function buildSparklinesFromMultichain(
  tokens: RankedMultichainToken[],
  priceHistoryByMultichainId: Partial<Record<string, PricePoint[]>>,
): SparklineMap {
  const map: SparklineMap = {}
  for (const token of tokens) {
    // multichainTokenKey, not raw multichainId: ungrouped tokens share the
    // '' sentinel and would otherwise all miss (or share) a sparkline.
    const key = multichainTokenKey(token)
    const history = priceHistoryByMultichainId[key]
    if (!history?.length) {
      continue
    }
    map[key] = history
  }
  return map
}
