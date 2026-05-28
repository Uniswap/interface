import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { SparklineMap } from '~/appGraphql/data/types'
import type { PricePoint } from '~/appGraphql/data/util'

/**
 * Builds a sparklines map from multichain tokens (multichainId -> priceHistory).
 * One entry per multichain token; no sparkline data for subrows.
 */
export function buildSparklinesFromMultichain(tokens: MultichainToken[]): SparklineMap {
  const map: SparklineMap = {}
  for (const token of tokens) {
    if (!token.multichainId) {
      continue
    }
    const history = token.stats?.priceHistory1d
    if (!history?.length) {
      continue
    }
    map[token.multichainId] = history.map((p): PricePoint => ({ timestamp: Number(p.timestamp), value: p.value }))
  }
  return map
}
