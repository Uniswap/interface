import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { SparklineMap } from '~/appGraphql/data/types'
import type { PricePoint } from '~/appGraphql/data/util'

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
    const multichainId = token.multichainToken?.multichainId
    if (!multichainId) {
      continue
    }
    const history = priceHistoryByMultichainId[multichainId]
    if (!history?.length) {
      continue
    }
    map[multichainId] = history
  }
  return map
}
